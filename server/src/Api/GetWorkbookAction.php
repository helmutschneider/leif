<?php declare(strict_types=1);

namespace Leif\Api;

use DateTimeImmutable;
use Leif\Database;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\User\UserInterface;

final class GetWorkbookAction
{
    const SQL_GET_TRANSACTIONS = <<<SQL
SELECT t.*
  FROM "transaction" AS t
 INNER JOIN voucher AS v
    ON v.voucher_id = t.voucher_id
 WHERE v.organization_id = :organization_id
   AND v.is_template = :is_template
 ORDER BY t.account ASC
SQL;

    const SQL_GET_VOUCHERS = <<<SQL
SELECT v.*
  FROM voucher AS v
 WHERE v.organization_id = :organization_id
   AND v.is_template = 0
 ORDER BY v.date DESC,
          v.created_at DESC
SQL;

    const SQL_GET_TEMPLATES = <<<SQL
SELECT v.*
  FROM voucher AS v
 WHERE v.organization_id = :organization_id
   AND v.is_template = 1
 ORDER BY v.name ASC,
          v.created_at ASC
SQL;

    const SQL_GET_ATTACHMENTS = <<<SQL
SELECT a.attachment_id,
       a.name,
       a.mime,
       a.size,
       HEX(a.checksum) AS checksum,
       a.voucher_id
  FROM attachment AS a
 INNER JOIN voucher AS v
    ON v.voucher_id = a.voucher_id
 WHERE v.organization_id = :organization_id
SQL;

    private Database $db;

    public function __construct(Database $db)
    {
        $this->db = $db;
    }

    public function __invoke(UserInterface $user): Response
    {
        $vouchers = $this->findVouchers($user->getOrganizationId(), false);
        $templates = $this->findVouchers($user->getOrganizationId(), true);

        $result = [
            'accounts' => require __DIR__ . '/../../../data/accounts-2022.php',
            'currency' => 'SEK',
            'templates' => $templates,
            'vouchers' => $vouchers,
        ];

        return new JsonResponse($result, Response::HTTP_OK);
    }

    protected function findVouchers(int $organizationId, bool $isTemplate): array
    {
        $vouchers = $this->db->selectAll(
            $isTemplate
                ? static::SQL_GET_TEMPLATES
                : static::SQL_GET_VOUCHERS,
            [':organization_id' => $organizationId]
        );
        $transactions = $this->db->selectAll(static::SQL_GET_TRANSACTIONS, [
            ':organization_id' => $organizationId,
            ':is_template' => (int) $isTemplate,
        ]);
        $attachments = $this->db->selectAll(static::SQL_GET_ATTACHMENTS, [
            ':organization_id' => $organizationId,
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

        $out = [];

        foreach ($vouchers as $voucher) {
            $voucherId = $voucher['voucher_id'];

            $voucher['created_at'] = (new DateTimeImmutable($voucher['created_at']))->format('c');
            $voucher['updated_at'] = (new DateTimeImmutable($voucher['updated_at']))->format('c');
            $voucher['attachments'] = $attachmentsByVoucherId[$voucherId] ?? [];
            $voucher['transactions'] = $transactionsByVoucherId[$voucherId] ?? [];
            $voucher['is_template'] = (bool) $voucher['is_template'];
            $out[] = $voucher;
        }

        return $out;
    }
}
