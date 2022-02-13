<?php declare(strict_types=1);

namespace Leif;

use Exception;
use PDO;

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
        $stmt->execute($parameters);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row === false) {
            return null;
        }
        return $row;
    }

    public function selectAll(string $query, array $parameters = []): array
    {
        $stmt = $this->db->prepare($query);
        $stmt->execute($parameters);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function execute(string $query, array $parameters = []): void
    {
        $stmt = $this->db->prepare($query);
        $stmt->execute($parameters);
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
}
