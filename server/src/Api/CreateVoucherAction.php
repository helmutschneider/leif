<?php declare(strict_types=1);

namespace Leif\Api;

use DateTimeImmutable;
use InvalidArgumentException;
use Leif\Database;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\User\UserInterface;

final class CreateVoucherAction
{
    const ERR_NOT_BALANCED = [
        'message' => 'Credits and debits are not balanced.',
    ];
    const ERR_NO_TRANSACTIONS = [
        'message' => 'No transactions found.',
    ];
    const VOUCHER_KIND_CREDIT = 0;
    const VOUCHER_KIND_DEBIT = 1;
    const VOUCHER_KIND_MAP = [
        'credit' => self::VOUCHER_KIND_CREDIT,
        'debit' => self::VOUCHER_KIND_DEBIT,
    ];

    private Database $db;

    public function __construct(Database $db)
    {
        $this->db = $db;
    }

    public function __invoke(Request $request, UserInterface $user): Response
    {
        $body = $request->toArray();

        if (!$this->isOwnerOfWorkbook((int)$body['workbook_id'], $user)) {
            return new JsonResponse(['message' => sprintf('Workbook \'%d\' not found.', $body['workbook_id'])], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if (empty($body['transactions'])) {
            return new JsonResponse(static::ERR_NO_TRANSACTIONS, Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if (!static::areCreditsAndDebitsBalanced($body['transactions'] ?? [])) {
            return new JsonResponse(static::ERR_NOT_BALANCED, Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        return $this->db->transaction(function () use ($body) {
            $this->db->execute(
                'INSERT INTO voucher (name, date, workbook_id, is_template) VALUES (?, ?, ?, ?)',
                [
                    (string)$body['name'],
                    (string)$body['date'],
                    (int)$body['workbook_id'],
                    (int) ($body['is_template'] ?? false),
                ]
            );

            $voucherId = $this->db->getLastInsertId();
            $response = $body;

            foreach ($body['transactions'] ?? [] as $item) {
                static::insertTransaction($this->db, $item, $voucherId);
            }

            foreach ($body['attachments'] ?? [] as $index => $item) {
                $attachmentId = static::insertAttachment($this->db, $item, $voucherId);
                $response['attachments'][$index]['attachment_id'] = $attachmentId;
                unset($response['attachments'][$index]['data']);
            }

            $response['voucher_id'] = $voucherId;

            return new JsonResponse($response, Response::HTTP_CREATED);
        });
    }

    public static function areCreditsAndDebitsBalanced(array $transactions): bool
    {
        $sum = 0;
        foreach ($transactions as $transaction) {
            switch ($transaction['kind']) {
                case 'credit':
                    $sum -= $transaction['amount'];
                    break;
                case 'debit':
                    $sum += $transaction['amount'];
                    break;
            }
        }
        return $sum === 0;
    }

    public static function insertTransaction(Database $db, array $transaction, int $voucherId): int
    {
        $kind = static::VOUCHER_KIND_MAP[$transaction['kind']] ?? null;

        if ($kind === null) {
            throw new InvalidArgumentException('Invalid or empty transaction kind. Must be \'credit\' or \'debit\'.');
        }

        if ($transaction['amount'] < 0) {
            throw new InvalidArgumentException('\'amount\' must be greater than 0.');
        }

        $db->execute('INSERT INTO "transaction" (account, amount, kind, voucher_id) VALUES (?, ?, ?, ?)', [
            (int)$transaction['account'],
            (int)$transaction['amount'],
            $kind,
            $voucherId,
        ]);

        return $db->getLastInsertId();
    }

    public static function insertAttachment(Database $db, array $attachment, int $voucherId): int
    {
        $binary = base64_decode($attachment['data'], true);
        $size = mb_strlen($binary, '8bit');

        $db->execute('INSERT INTO attachment (name, data, mime, size, voucher_id) VALUES (?, ?, ?, ?, ?)', [
            (string)$attachment['name'],
            [$binary, Database::PARAM_BLOB],
            (string)$attachment['mime'],
            $size,
            $voucherId,
        ]);

        return $db->getLastInsertId();
    }

    private function isOwnerOfWorkbook(int $id, UserInterface $user): bool
    {
        $wb = $this->db->selectOne('SELECT 1 FROM workbook WHERE workbook_id = :id AND user_id = :user_id', [
            ':id' => $id,
            ':user_id' => $user->getId(),
        ]);

        return $wb !== null;
    }
}
