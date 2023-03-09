<?php declare(strict_types=1);

namespace Leif\Api;

use DateTimeImmutable;
use DateTimeInterface;
use DateTimeZone;
use Leif\Database;
use Leif\Security\User;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
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

    const SQL_GET_INVOICE_TEMPLATES = <<<SQL
SELECT i.invoice_template_id,
       i.name,
       i.body
  FROM invoice_template AS i
 WHERE i.organization_id = :organization_id
SQL;


    private Database $db;

    public function __construct(Database $db)
    {
        $this->db = $db;
    }

    public function __invoke(Request $request, UserInterface $user): Response
    {
        assert($user instanceof User);

        $vouchers = $this->findVouchers($user->getOrganizationId(), false);
        $templates = $this->findVouchers($user->getOrganizationId(), true);
        $organization = $this->db->selectOne(
            'SELECT * FROM organization WHERE organization_id = ?',
            [$user->getOrganizationId()]
        );

        $tz = new DateTimeZone('Europe/Stockholm');
        $today = DateTimeImmutable::createFromFormat('Y-m-d', $request->get('today', date('Y-m-d')), $tz);
        $invoiceTemplates = $this->findInvoiceTemplates($user->getOrganizationId());

        $result = [
            'accounts' => require __DIR__ . '/../../../data/accounts-2022.php',
            'account_balances' => static::createAccountBalanceMap($vouchers, $today, $organization['carry_accounts']),
            'currency' => 'SEK',
            'invoice_templates' => $invoiceTemplates,
            'organization' => $organization,
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

    protected function findInvoiceTemplates(int $organizationId): array
    {
        return $this->db->selectAll(static::SQL_GET_INVOICE_TEMPLATES, [
            ':organization_id' => $organizationId,
        ]);
    }

    /**
     * @param array $vouchers
     * @param DateTimeInterface $today
     * @param string $carryAccountsPattern
     * @return array<int, int>
     */
    public static function createAccountBalanceMap(array $vouchers, DateTimeInterface $today, string $carryAccountsPattern): array
    {
        $result = [];
        $year = (int)$today->format('Y');
        $carryRegExp = static::buildCarryAccountsRegExp($carryAccountsPattern);
        $tz = $today->getTimezone();

        foreach ($vouchers as $voucher) {
            $dt = DateTimeImmutable::createFromFormat('Y-m-d', $voucher['date'], $tz);

            if ($dt > $today) {
                continue;
            }

            $voucherYear = (int)$dt->format('Y');

            foreach ($voucher['transactions'] as $transaction) {
                $account = $transaction['account'];

                if ($voucherYear === $year || ($voucherYear < $year && preg_match($carryRegExp, (string)$account))) {
                    $prev = $result[$account] ?? 0;
                    $amount = $transaction['amount'];
                    $result[$account] = $prev + ($transaction['kind'] === 'debit' ? $amount : (-$amount));
                }
            }
        }

        return $result;
    }

    static function buildCarryAccountsRegExp(string $pattern): string
    {
        // keep numbers, commas and wildcards.
        $pattern = preg_replace('/[^\d,*]/', '', $pattern);

        // escape regex characters.
        $pattern = preg_replace('/[.*+?^${}()|\[\]\\\\]/', '\\\\$0', $pattern);

        $pattern = preg_replace('/,/', '|', $pattern);
        $pattern = preg_replace('/\\\\\*/', '.*', $pattern);

        return "/^(?:{$pattern})$/";
    }
}
