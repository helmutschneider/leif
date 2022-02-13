<?php declare(strict_types=1);

namespace Leif\Api;

use DateTimeImmutable;
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

        if (!$this->areCreditsAndDebitsBalanced($body['transactions'] ?? [])) {
            return new JsonResponse(static::ERR_NOT_BALANCED, Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $this->db->transaction(function () use ($body) {
            $now = new DateTimeImmutable('now');

            $this->db->execute(
                'INSERT INTO voucher (name, created_at, date, workbook_id) VALUES (?, ?, ?, ?)',
                [
                    $body['name'],
                    $now->format('Y-m-d H:i:s'),
                    $body['date'],
                    $body['workbook_id']
                ]
            );

            $voucherId = $this->db->getLastInsertId();

            foreach ($body['transactions'] ?? [] as $transaction) {
                $this->db->execute('INSERT INTO "transaction" (account, amount, kind, voucher_id) VALUES (?, ?, ?, ?)', [
                    $transaction['account'],
                    abs($transaction['amount']),
                    static::VOUCHER_KIND_MAP[$transaction['kind']],
                    $voucherId,
                ]);
            }
        });

        $res = array_merge($body, [
            'voucher_id' => $this->db->getLastInsertId(),
        ]);

        return new JsonResponse($res, Response::HTTP_CREATED);
    }

    private function areCreditsAndDebitsBalanced(array $transactions): bool
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

    private function isOwnerOfWorkbook(int $id, UserInterface $user): bool
    {
        $wb = $this->db->selectOne('SELECT 1 FROM workbook WHERE workbook_id = :id AND user_id = :user_id', [
            ':id' => $id,
            ':user_id' => $user->getId(),
        ]);

        return $wb !== null;
    }
}
