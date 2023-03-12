<?php declare(strict_types=1);

namespace Leif\Security;

use Symfony\Component\PasswordHasher\Exception\InvalidPasswordException;
use Symfony\Component\PasswordHasher\PasswordHasherInterface;

final class NativeHmacHasher implements HmacHasher
{
    const HASH_IS_BINARY = false;

    private readonly SecretKey $key;

    public function __construct(SecretKey $key)
    {
        $this->key = $key;
    }

    public function hash(string $value): string
    {
        return hash_hmac('sha256', $value, $this->key->getValue(), static::HASH_IS_BINARY);
    }

    public function verify(string $hash, string $value): bool
    {
        $hashedValue = $this->hash($value);
        return hash_equals($hashedValue, $hash);
    }
}
