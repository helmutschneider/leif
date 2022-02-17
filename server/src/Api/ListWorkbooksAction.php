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
 WHERE w.user_id = :user_id
   AND v.is_template = :is_template
 ORDER BY t.account ASC
SQL;

    const SQL_GET_VOUCHERS = <<<SQL
SELECT v.*
  FROM voucher AS v
 INNER JOIN workbook AS w
    ON w.workbook_id = v.workbook_id
 WHERE w.user_id = :user_id
   AND v.is_template = :is_template
 ORDER BY v.date DESC,
          v.created_at DESC
SQL;

    const SQL_GET_ACCOUNT_CARRIES = <<<SQL
SELECT ac.*
  FROM account_carry AS ac
 INNER JOIN workbook AS w
    ON ac.workbook_id = w.workbook_id
 WHERE w.user_id = :user_id
SQL;

    const SQL_GET_ATTACHMENTS = <<<SQL
SELECT a.attachment_id,
       a.name,
       a.mime,
       a.size,
       a.voucher_id
  FROM attachment AS a
 INNER JOIN voucher AS v
    ON v.voucher_id = a.voucher_id
 INNER JOIN workbook AS wb
    ON wb.workbook_id = v.workbook_id
 WHERE wb.user_id = :user_id
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

        $accountCarries = $this->db->selectAll(static::SQL_GET_ACCOUNT_CARRIES, [
            ':user_id' => $user->getId(),
        ]);

        $vouchersByWorkbookId = $this->findVouchersKeyedByWorkbookId($user->getId(), false);
        $templatesByWorkbookId = $this->findVouchersKeyedByWorkbookId($user->getId(), true);
        $accountCarriesByWorkbookId = [];

        foreach ($accountCarries as $item) {
            $workbookId = $item['workbook_id'];
            if (!isset($accountCarriesByWorkbookId[$workbookId])) {
                $accountCarriesByWorkbookId[$workbookId] = [];
            }
            $accountCarriesByWorkbookId[$workbookId][] = $item;
        }

        $result = [];
        foreach ($workbooks as $wb) {
            $workbookId = $wb['workbook_id'];
            $wb['vouchers'] = $vouchersByWorkbookId[$workbookId] ?? [];
            $wb['templates'] = $templatesByWorkbookId[$workbookId] ?? [];
            $wb['account_carries'] = $accountCarriesByWorkbookId[$workbookId] ?? [];

            $result[] = $wb;
        }

        return new JsonResponse($result, Response::HTTP_OK);
    }

    protected function findVouchersKeyedByWorkbookId(int $userId, bool $isTemplate): array
    {
        $vouchers = $this->db->selectAll(static::SQL_GET_VOUCHERS, [
            ':user_id' => $userId,
            ':is_template' => (int) $isTemplate,
        ]);
        $transactions = $this->db->selectAll(static::SQL_GET_TRANSACTIONS, [
            ':user_id' => $userId,
            ':is_template' => (int) $isTemplate,
        ]);
        $attachments = $this->db->selectAll(static::SQL_GET_ATTACHMENTS, [
            ':user_id' => $userId,
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

        $attachmentsByVoucherId = [];

        foreach ($attachments as $attachment) {
            $voucherId = $attachment['voucher_id'];
            if (!isset($attachmentsByVoucherId[$voucherId])) {
                $attachmentsByVoucherId[$voucherId] = [];
            }
            $attachmentsByVoucherId[$voucherId][] = $attachment;
        }

        $vouchersByWorkbookId = [];

        foreach ($vouchers as $voucher) {
            $wbId = $voucher['workbook_id'];
            $voucherId = $voucher['voucher_id'];
            if (!isset($vouchersByWorkbookId[$wbId])) {
                $vouchersByWorkbookId[$wbId] = [];
            }

            $voucher['created_at'] = (new DateTimeImmutable($voucher['created_at']))->format('c');
            $voucher['updated_at'] = (new DateTimeImmutable($voucher['updated_at']))->format('c');
            $voucher['attachments'] = $attachmentsByVoucherId[$voucherId] ?? [];
            $voucher['transactions'] = $transactionsByVoucherId[$voucherId] ?? [];
            $voucher['is_template'] = (bool) $voucher['is_template'];
            $vouchersByWorkbookId[$voucher['workbook_id']][] = $voucher;
        }

        return $vouchersByWorkbookId;
    }
}
