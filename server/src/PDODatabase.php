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

    public function getPDO(): PDO
    {
        return $this->db;
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
        return $row;
    }

    public function selectAll(string $query, array $parameters = []): array
    {
        $stmt = $this->db->prepare($query);
        static::bindValues($stmt, $parameters);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
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
}
