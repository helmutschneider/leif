<?php declare(strict_types=1);

namespace Leif\Database;

use Leif\Database;

final class Migration_20231012_1134_Organization implements Migration
{
    const USER_TABLE_SQL = '
CREATE TABLE "user" (
    "user_id" INTEGER PRIMARY KEY NOT NULL,
    "username" TEXT NOT NULL UNIQUE,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT \'\',
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organization_id" INTEGER NOT NULL,
    FOREIGN KEY ("organization_id")
        REFERENCES "organization" ("organization_id")
        ON UPDATE CASCADE
        ON DELETE CASCADE
);
    ';

    const TOKEN_TABLE_SQL = '
CREATE TABLE "token" (
    "token_id" INTEGER PRIMARY KEY NOT NULL,
    "value" BLOB NOT NULL,
    "seen_at" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    FOREIGN KEY ("user_id")
        REFERENCES "user" ("user_id")
        ON UPDATE CASCADE
        ON DELETE CASCADE
);
    ';

    public function apply(Database $db): void
    {
        $db->execute('ALTER TABLE "user" RENAME TO "organization"');
        $db->execute('ALTER TABLE "organization" RENAME COLUMN "user_id" TO "organization_id"');
        $db->execute('ALTER TABLE "organization" RENAME COLUMN "username" TO "name"');
        $db->execute(static::USER_TABLE_SQL);

        $orgs = $db->selectAll('SELECT * FROM "organization"');

        foreach ($orgs as $org) {
            $db->execute(
                'INSERT INTO "user" ("username", "password_hash", "organization_id", "role")
                VALUES (:username, :password_hash, :organization_id, :role)', [
                    ':username' => $org['name'],
                    ':password_hash' => $org['password_hash'],
                    ':organization_id' => $org['organization_id'],
                    ':role' => "admin",
                ]);
        }

        $db->execute('ALTER TABLE "organization" DROP COLUMN "password_hash"');
        $db->execute('ALTER TABLE "voucher" RENAME COLUMN "user_id" TO "organization_id"');

        $db->execute('DROP TABLE "token"');
        $db->execute(static::TOKEN_TABLE_SQL);
    }
}
