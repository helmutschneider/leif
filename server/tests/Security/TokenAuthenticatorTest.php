<?php declare(strict_types=1);

namespace Leif\Tests\Security;

use DateTimeImmutable;
use Leif\Security\HmacHasher;
use Leif\Security\TokenUserProvider;
use Leif\Security\User;
use Leif\Tests\TestCase;
use Symfony\Component\Security\Core\Exception\UserNotFoundException;

final class TokenAuthenticatorTest extends TestCase
{
    public TokenUserProvider $provider;

    public function setUp(): void
    {
        parent::setUp();

        static::createUser($this->db, 'tester');

        $hasher = new class implements HmacHasher {
            public function hash(string $value): string
            {
                return $value . $value;
            }

            public function verify(string $hash, string $value): bool
            {
                return $hash === $this->hash($value);
            }
        };

        $this->provider = new TokenUserProvider(
            $this->db, $hasher, 3600, new DateTimeImmutable('2022-02-10 15:00:00')
        );
    }

    public function testFailsToLoadUserWithoutToken()
    {
        $this->expectException(UserNotFoundException::class);
        $this->provider->loadUserByApiToken('123');
    }

    public function testFailsWithExpiredToken()
    {
        $this->expectException(UserNotFoundException::class);
        static::createToken($this->db, '123123', 1, '2022-01-01 01:00:00');
        $this->provider->loadUserByApiToken('123');
    }

    public function testFailsWithWrongTokenValue()
    {
        $this->expectException(UserNotFoundException::class);
        static::createToken($this->db, '123123', 1, '2022-02-10 14:30:00');
        $this->provider->loadUserByApiToken('12');
    }

    public function testSucceedsWithValidToken()
    {
        static::createToken($this->db, '123123', 1, '2022-02-10 14:30:00');
        $user = $this->provider->loadUserByApiToken('123');
        $this->assertInstanceOf(User::class, $user);
    }
}
