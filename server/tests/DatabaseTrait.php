<?php declare(strict_types=1);

namespace Leif\Tests;

use DateTimeImmutable;
use Leif\Api\CreateVoucherAction;
use Leif\Database;

trait DatabaseTrait
{
    public static function createUser(Database $db, string $username, string $plainTextPassword = ''): int
    {
        $db->execute('INSERT INTO organization (name) VALUES (?)', [$username]);
        $db->execute('INSERT INTO user (username, password_hash, organization_id) VALUES (?, ?, ?)', [
            $username,
            password_hash($plainTextPassword, PASSWORD_BCRYPT, ['cost' => 4]),
            $db->getLastInsertId(),
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

    public static function createVoucher(Database $db, int $userId): int
    {
        $organizationId = static::getOrganizationId($db, $userId);
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
            'Hello World',
            'text/plain',
            0,
            ['', Database::PARAM_BLOB],
            $voucherId,
        ]);
        return $db->getLastInsertId();
    }

    public static function getOrganizationId(Database $db, int $userId): int
    {
        $org = $db->selectOne('
SELECT o.*
  FROM organization AS o
 INNER JOIN user AS u
    ON u.organization_id = o.organization_id
 WHERE u.user_id = :user_id
        ', [':user_id' => $userId]);

        assert($org);

        return $org['organization_id'];
    }
}
