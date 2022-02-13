<?php declare(strict_types=1);

namespace Leif\Security;

use Symfony\Component\PasswordHasher\Exception\InvalidPasswordException;
use Symfony\Component\PasswordHasher\PasswordHasherInterface;

final class NativeHmacHasher implements HmacHasherInterface
{
    private SecretKey $key;
    private bool $binary = false;

    public function __construct(SecretKey $key)
    {
        $this->key = $key;
    }

    public function hash(string $value): string
    {
        return hash_hmac('sha256', $value, $this->key->getValue(), $this->binary);
    }

    public function verify(string $hash, string $value): bool
    {
        $hashedFromUser = $this->hash($value);
        return hash_equals($hash, $hashedFromUser);
    }
}
