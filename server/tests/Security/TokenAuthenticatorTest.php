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

    public function fixtures(): array
    {
        return [
            'organization',
            'user',
        ];
    }

    public function setUp(): void
    {
        parent::setUp();

        $hasher = static::getContainer()->get(HmacHasher::class);
        $this->provider = new TokenUserProvider(
            $this->db, $hasher, 3600, new DateTimeImmutable('2022-02-10 15:00:00')
        );
    }

    public function testFailsToLoadUserWithoutToken(): void
    {
        $this->expectException(UserNotFoundException::class);
        $this->provider->loadUserByApiToken('1234');
    }

    public function testFailsWithExpiredToken(): void
    {
        $this->expectException(UserNotFoundException::class);
        static::createToken($this->db, '12341234', 1, '2022-01-01 01:00:00');
        $this->provider->loadUserByApiToken('1234');
    }

    public function testFailsWithWrongTokenValue(): void
    {
        $this->expectException(UserNotFoundException::class);
        static::createToken($this->db, '12341234', 1, '2022-02-10 14:30:00');
        $this->provider->loadUserByApiToken('123');
    }

    public function testSucceedsWithValidToken(): void
    {
        static::createToken($this->db, '1234', 1, '2022-02-10 14:30:00');
        $user = $this->provider->loadUserByApiToken('1234');
        $this->assertInstanceOf(User::class, $user);
    }
}
