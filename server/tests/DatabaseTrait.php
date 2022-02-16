<?php declare(strict_types=1);

namespace Leif\Tests;

use DateTimeImmutable;
use Leif\Api\CreateVoucherAction;
use Leif\Database;

trait DatabaseTrait
{
    public static function loadSchema(Database $db)
    {
        $schema = file_get_contents(__DIR__ . '/../../data/sqlite.sql');
        $parts = explode(';', trim($schema));

        foreach ($parts as $part) {
            $part = trim($part);
            if (!$part) {
                continue;
            }
            $db->execute($part);
        }
    }

    public static function createUser(Database $db, string $username, string $plainTextPassword = ''): int
    {
        $db->execute('INSERT INTO user (username, password_hash) VALUES (?, ?)', [
            $username,
            password_hash($plainTextPassword, PASSWORD_BCRYPT, ['cost' => 4]),
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

    public static function createWorkbook(Database $db, int $userId): int
    {
        $db->execute('INSERT INTO workbook (name, year, user_id) VALUES (?, ?, ?)', [
            'Test workbook',
            2022,
            $userId,
        ]);
        return $db->getLastInsertId();
    }

    public static function createVoucher(Database $db, int $workbookId): int
    {
        $db->execute('INSERT INTO voucher (date, name, workbook_id) VALUES (?, ?, ?)', [
            '2022-02-14',
            'Test voucher',
            $workbookId,
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
        $db->execute('INSERT INTO attachment (name, data, mime, size, voucher_id) VALUES (?, ?, ?, ?, ?)', [
            'test_attachment.txt',
            'Hello World',
            'text/plain',
            0,
            $voucherId,
        ]);
        return $db->getLastInsertId();
    }
}
