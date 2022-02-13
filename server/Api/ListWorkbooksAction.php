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
SQL;

    const SQL_GET_VOUCHERS = <<<SQL
SELECT v.*
  FROM voucher AS v
 INNER JOIN workbook AS w
    ON w.workbook_id = v.workbook_id
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
        $vouchers = $this->db->selectAll(static::SQL_GET_VOUCHERS, [
            ':id' => $user->getId(),
        ]);
        $transactions = $this->db->selectAll(static::SQL_GET_TRANSACTIONS, [
            ':id' => $user->getId(),
        ]);

        $workbooksById = [];
        $vouchersById = [];

        foreach ($workbooks as $wb) {
            $workbooksById[$wb['workbook_id']] = $wb;
        }

        foreach ($vouchers as $v) {
            $v['created_at'] = (new DateTimeImmutable($v['created_at']))->format('c');
            $vouchersById[$v['voucher_id']] = $v;
        }

        foreach ($transactions as $t) {
            $voucherId = $t['voucher_id'];
            if (!isset($vouchersById[$voucherId]['transactions'])) {
                $vouchersById[$voucherId]['transactions'] = [];
            }
            switch ($t['kind']) {
                case CreateVoucherAction::VOUCHER_KIND_CREDIT:
                    $t['kind'] = 'credit';
                    break;
                case CreateVoucherAction::VOUCHER_KIND_DEBIT:
                    $t['kind'] = 'debit';
                    break;
            }
            $vouchersById[$voucherId]['transactions'][] = $t;
        }

        foreach ($vouchersById as $voucher) {
            $wbId = $voucher['workbook_id'];
            if (!isset($workbooksById[$wbId]['vouchers'])) {
                $workbooksById[$wbId]['vouchers'] = [];
            }
            $workbooksById[$wbId]['vouchers'][] = $voucher;
        }

        return new JsonResponse(array_values($workbooksById));
    }
}
