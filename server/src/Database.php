<?php declare(strict_types=1);

namespace Leif;

interface Database
{
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
