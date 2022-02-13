<?php declare(strict_types=1);

namespace Leif\Security;

interface HmacHasherInterface
{
    public function hash(string $value): string;
    public function verify(string $hash, string $value): bool;
}
