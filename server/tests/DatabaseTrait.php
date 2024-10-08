<?php declare(strict_types=1);

namespace Leif\Tests;

use DateTimeImmutable;
use Leif\Api\CreateVoucherAction;
use Leif\Database;

trait DatabaseTrait
{
    public static function createVoucher(Database $db, int $userId, int $organizationId): int
    {
        $db->execute('INSERT INTO voucher (date, name, organization_id) VALUES (?, ?, ?)', [
            '2022-02-14',
            'Test voucher',
            $organizationId
        ]);
        return $db->getLastInsertId();
    }

    public static function createTransaction(Database $db, int $voucherId): int
    {
        $db->execute('INSERT INTO "transaction" (account, amount, kind, voucher_id) VALUES (?, ?, ?, ?)', [
            1910,
            100,
            CreateVoucherAction::VOUCHER_KIND_CREDIT,
            $voucherId,
        ]);
        return $db->getLastInsertId();
    }

    public static function createAttachment(Database $db, int $voucherId): int
    {
        $db->execute('INSERT INTO attachment (name, data, mime, size, checksum, voucher_id) VALUES (?, ?, ?, ?, ?, ?)', [
            'test_attachment.txt',
            ['Hello World', Database::PARAM_BLOB],
            'text/plain',
            0,
            ['', Database::PARAM_BLOB],
            $voucherId,
        ]);
        return $db->getLastInsertId();
    }

    public static function createToken(Database $db, string $value, int $userId,  string $seenAt = ''): int
    {
        if (!$seenAt) {
            $seenAt = (new DateTimeImmutable('now'))->format('Y-m-d H:i:s');
        }

        $db->execute('INSERT INTO token (value, seen_at, user_id) VALUES (?, ?, ?)', [
            [$value, Database::PARAM_BLOB],
            $seenAt,
            $userId,
        ]);
        return $db->getLastInsertId();
    }
}
