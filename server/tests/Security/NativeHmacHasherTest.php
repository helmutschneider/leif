<?php declare(strict_types=1);

namespace Leif\Tests\Security;

use Leif\Security\HmacHasher;
use Leif\Security\NativeHmacHasher;
use Leif\Security\SecretKey;
use Leif\Tests\TestCase;

final class NativeHmacHasherTest extends TestCase
{
    const SECRET_KEY = '4fc68a3dc2b26f95d106edd257ebe0bcfedef7f6f8ddd6440fad6641312943ab';
    const HASH_OF_BRO = 'f9ee44bea40e46b7e8293231cd80cf41edccbd0103b7cd91448520a6e2556aff';

    private HmacHasher|null $hasher = null;

    public function setUp(): void
    {
        parent::setUp();

        $this->hasher = new NativeHmacHasher(
            new SecretKey(hex2bin(static::SECRET_KEY))
        );
    }

    public function testHashesCorrectly(): void
    {
        $this->assertSame(
            static::HASH_OF_BRO,
            $this->hasher->hash('bro')
        );
    }

    public function testVerifiesCorrectly(): void
    {
        $this->assertTrue(
            $this->hasher->verify(static::HASH_OF_BRO, 'bro')
        );
    }

    public function testFailsToVerifyString(): void
    {
        $this->assertFalse(
            $this->hasher->verify(static::HASH_OF_BRO . 'aa', 'bro')
        );
    }
}
