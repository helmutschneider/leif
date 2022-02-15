<?php declare(strict_types=1);

namespace Leif;

use PDO;

interface Database
{
    const PARAM_INTEGER = PDO::PARAM_INT;
    const PARAM_FLOAT = PDO::PARAM_STR;
    const PARAM_BOOLEAN = PDO::PARAM_BOOL;
    const PARAM_STRING = PDO::PARAM_STR;

    // PARAM_LOB surprisingly also works on strings.
    const PARAM_BLOB = PDO::PARAM_LOB;

    public function selectOne(string $query, array $parameters = []): ?array;
    public function selectAll(string $query, array $parameters = []): array;
    public function execute(string $query, array $parameters = []): void;
    public function getLastInsertId(): ?int;

    /**
     * @param callable $fn
     * @return mixed
     */
    public function transaction(callable $fn);
}
