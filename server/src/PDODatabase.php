<?php declare(strict_types=1);

namespace Leif;

use Exception;
use PDO;
use PDOStatement;

final class PDODatabase implements Database
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function selectOne(string $query, array $parameters = []): ?array
    {
        $stmt = $this->db->prepare($query);
        static::bindValues($stmt, $parameters);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row === false) {
            return null;
        }

        $schema = static::getColumnSchema($stmt);
        return static::castToNativeTypes($schema, [$row])[0];
    }

    public function selectAll(string $query, array $parameters = []): array
    {
        $stmt = $this->db->prepare($query);
        static::bindValues($stmt, $parameters);
        $stmt->execute();
        $schema = [];
        $rows = [];

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            // workaround for https://bugs.php.net/bug.php?id=79664.
            // this should probably be done directly after the call
            // to "execute()" but we can't do that atm.
            //
            // this seems to be fixed on later 7.4 versions but not
            // on 7.4.3 which is on ubuntu mainline.
            if ($schema === []) {
                $schema = static::getColumnSchema($stmt);
            }
            $rows[] = $row;
        }

        return static::castToNativeTypes($schema, $rows);
    }

    public function execute(string $query, array $parameters = []): void
    {
        $stmt = $this->db->prepare($query);
        static::bindValues($stmt, $parameters);
        $stmt->execute();
    }

    public function getLastInsertId(): ?int
    {
        $num = $this->db->lastInsertId();
        if ($num) {
            return (int) $num;
        }
        return $num;
    }

    public function transaction(callable $fn)
    {
        $this->db->beginTransaction();

        try {
            $res = $fn();
            $this->db->commit();
            return $res;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    private static function bindValues(PDOStatement $stmt, array $values): void
    {
        $paramIndex = 1;

        foreach ($values as $name => $value) {
            // unnamed parameters ("?") are 1-indexed.
            if (is_int($name)) {
                $name = $paramIndex;
            }

            $type = PDO::PARAM_STR;
            if (is_array($value)) {
                [$value, $type] = $value;
            } else if (is_int($value)) {
                $type = PDO::PARAM_INT;
            } else if (is_bool($value)) {
                $type = PDO::PARAM_BOOL;
            }
            $stmt->bindValue($name, $value, $type);

            ++$paramIndex;
        }
    }

    private static function getColumnSchema(PDOStatement $stmt): array
    {
        // the PDO driver for SQLite returns everything as strings, at
        // least on PHP 7.4. this logic inspects the return table schema
        // and maps the columns to native PHP types if possible.
        //
        // this method must be executed immediately after PDOStatement::execute().
        // if you start fetching rows it seems the database forgets the
        // data types and just says "null" for everything.
        $schema = [];

        for ($i = 0; $i < $stmt->columnCount(); ++$i) {
            $meta = $stmt->getColumnMeta($i);
            $columnName = $meta['name'];
            $schema[$columnName] = $meta['native_type'];
        }

        return $schema;
    }

    private static function castToNativeTypes(array $schema, array $rows): array
    {
        $out = [];

        foreach ($rows as $row) {
            foreach ($schema as $columnName => $type) {
                if ($row[$columnName] === null) {
                    continue;
                }
                switch ($type) {
                    case 'integer':
                        $row[$columnName] = (int) $row[$columnName];
                        break;
                    case 'double':
                        $row[$columnName] = (float) $row[$columnName];
                        break;
                    case 'string':
                        $row[$columnName] = (string) $row[$columnName];
                        break;
                }
            }
            $out[] = $row;
        }

        return $out;
    }
}
