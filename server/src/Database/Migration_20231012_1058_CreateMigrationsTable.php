<?php declare(strict_types=1);

namespace Leif\Database;

use Leif\Database;

final class Migration_20231012_1058_CreateMigrationsTable implements Migration
{
    const SQL_QUERY = '
CREATE TABLE "migration" (
    "migration_id" INTEGER PRIMARY KEY NOT NULL,
    "name" TEXT NOT NULL,
    "applied_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
    ';

    public function apply(Database $db): void
    {
        $db->execute(static::SQL_QUERY);
    }
}
