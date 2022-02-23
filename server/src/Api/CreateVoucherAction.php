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
    use ValidationTrait;

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
    const RULES = [
        'name' => 'required|string',
        'notes' => 'string',
        'date' => 'required|date_format:Y-m-d',
        'is_template' => 'required|boolean',

        'attachments' => 'array',
        'attachments.*.data' => 'required|string',
        'attachments.*.mime' => 'required|string',
        'attachments.*.name' => 'required|string',

        'transactions' => 'required|array',
        'transactions.*.account' => 'required|integer',
        'transactions.*.amount' => 'required|integer',
        'transactions.*.kind' => 'required|string',
    ];

    private Database $db;

    public function __construct(Database $db)
    {
        $this->db = $db;
    }

    public function __invoke(Request $request, UserInterface $user): Response
    {
        if ($err = $this->validate($request, static::RULES)) {
            return $err;
        }

        $body = $request->toArray();

        if (empty($body['transactions'])) {
            return new JsonResponse(static::ERR_NO_TRANSACTIONS, Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if (!static::areCreditsAndDebitsBalanced($body['transactions'] ?? [])) {
            return new JsonResponse(static::ERR_NOT_BALANCED, Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        return $this->db->transaction(function () use ($body, $user) {
            $this->db->execute(
                'INSERT INTO voucher (name, notes, date, is_template, user_id) VALUES (?, ?, ?, ?, ?)',
                [
                    $body['name'],
                    ($body['notes'] ?? ''),
                    $body['date'],
                    (int) ($body['is_template'] ?? false),
                    $user->getId(),
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
        $name = $attachment['name'];

        if ($binary === false) {
            throw new InvalidArgumentException(
                "Invalid base64 string in attachment '$name'."
            );
        }

        $checksum = hash('sha256', $binary, true);
        $size = mb_strlen($binary, '8bit');

        $db->execute('INSERT INTO attachment (name, data, mime, size, checksum, voucher_id) VALUES (?, ?, ?, ?, ?, ?)', [
            $name,
            [$binary, Database::PARAM_BLOB],
            $attachment['mime'],
            $size,
            [$checksum, Database::PARAM_BLOB],
            $voucherId,
        ]);

        return $db->getLastInsertId();
    }
}
