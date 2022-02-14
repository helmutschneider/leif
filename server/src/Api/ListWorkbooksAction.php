<?php declare(strict_types=1);

namespace Leif\Api;

use DateTimeImmutable;
use Leif\Database;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\User\UserInterface;

final class ListWorkbooksAction
{
    const SQL_GET_TRANSACTIONS = <<<SQL
SELECT t.*
  FROM "transaction" AS t
 INNER JOIN voucher AS v
    ON v.voucher_id = t.voucher_id
 INNER JOIN workbook AS w
    ON w.workbook_id = v.workbook_id
 WHERE w.user_id = :id
   AND v.is_template = :is_template
SQL;

    const SQL_GET_VOUCHERS = <<<SQL
SELECT v.*
  FROM voucher AS v
 INNER JOIN workbook AS w
    ON w.workbook_id = v.workbook_id
 WHERE w.user_id = :id
   AND v.is_template = :is_template
SQL;

    const SQL_GET_BALANCE_CARRIES = <<<SQL
SELECT bc.*
  FROM balance_carry AS bc
 INNER JOIN workbook AS w
    ON bc.workbook_id = w.workbook_id
 WHERE w.user_id = :id
SQL;


    private Database $db;

    public function __construct(Database $db)
    {
        $this->db = $db;
    }

    public function __invoke(UserInterface $user): Response
    {
        $workbooks = $this->db->selectAll('SELECT * FROM workbook WHERE user_id = :id', [
            ':id' => $user->getId(),
        ]);

        $balanceCarries = $this->db->selectAll(static::SQL_GET_BALANCE_CARRIES, [
            ':id' => $user->getId(),
        ]);

        $vouchersByWorkbookId = $this->findVouchersKeyedByWorkbookId($user->getId(), false);
        $templatesByWorkbookId = $this->findVouchersKeyedByWorkbookId($user->getId(), true);
        $result = [];
        foreach ($workbooks as $wb) {
            $wb['vouchers'] = $vouchersByWorkbookId[$wb['workbook_id']] ?? [];
            $wb['templates'] = $templatesByWorkbookId[$wb['workbook_id']] ?? [];
            $wb['balance'] = [];

            foreach ($balanceCarries as $item) {
                if ($item['workbook_id'] === $wb['workbook_id']) {
                    $wb['balance'][$item['account']] = $item['balance'];
                }
            }

            $result[] = $wb;
        }

        return new JsonResponse($result, Response::HTTP_OK);
    }

    protected function findVouchersKeyedByWorkbookId(int $userId, bool $isTemplate): array
    {
        $vouchers = $this->db->selectAll(static::SQL_GET_VOUCHERS, [
            ':id' => $userId,
            ':is_template' => (int) $isTemplate,
        ]);
        $transactions = $this->db->selectAll(static::SQL_GET_TRANSACTIONS, [
            ':id' => $userId,
            ':is_template' => (int) $isTemplate,
        ]);

        $transactionsByVoucherId = [];

        foreach ($transactions as $t) {
            $voucherId = $t['voucher_id'];

            if (!isset($transactionsByVoucherId[$voucherId])) {
                $transactionsByVoucherId[$voucherId] = [];
            }

            switch ($t['kind']) {
                case CreateVoucherAction::VOUCHER_KIND_CREDIT:
                    $t['kind'] = 'credit';
                    break;
                case CreateVoucherAction::VOUCHER_KIND_DEBIT:
                    $t['kind'] = 'debit';
                    break;
            }

            $transactionsByVoucherId[$voucherId][] = $t;
        }

        $vouchersByWorkbookId = [];

        foreach ($vouchers as $voucher) {
            $wbId = $voucher['workbook_id'];
            $voucherId = $voucher['voucher_id'];
            if (!isset($vouchersByWorkbookId[$wbId])) {
                $vouchersByWorkbookId[$wbId] = [];
            }

            $voucher['created_at'] = (new DateTimeImmutable($voucher['created_at']))->format('c');
            $voucher['attachments'] = [];
            $voucher['transactions'] = $transactionsByVoucherId[$voucherId] ?? [];
            $vouchersByWorkbookId[$voucher['workbook_id']][] = $voucher;
        }

        return $vouchersByWorkbookId;
    }
}
