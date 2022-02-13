<?php declare(strict_types=1);

namespace Leif\Security;

use DateTimeImmutable;
use DateInterval;
use Leif\Security\User;
use PDO;
use RuntimeException;
use Symfony\Component\PasswordHasher\PasswordHasherInterface;
use Symfony\Component\Security\Core\Exception\UnsupportedUserException;
use Symfony\Component\Security\Core\Exception\UserNotFoundException;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Core\User\UserProviderInterface;

final class TokenUserProvider implements UserProviderInterface
{
    private PDO $db;
    private HmacHasherInterface $hasher;
    private int $ttl;

    public function __construct(PDO $db, HmacHasherInterface $hasher, int $ttl)
    {
        $this->db = $db;
        $this->ttl = $ttl;
        $this->hasher = $hasher;
    }

    public function refreshUser(UserInterface $user)
    {
    }

    public function supportsClass(string $class)
    {
        return $class === User::class;
    }

    /**
     * @deprecated
     */
    public function loadUserByUsername(string $username)
    {
    }

    public function loadUserByIdentifier(string $identifier): UserInterface
    {
        $stmt = $this->db->prepare('SELECT * FROM user WHERE username = ?');
        $stmt->execute([
            $identifier,
        ]);
        $row = $stmt->fetch();
        if (!$row) {
            throw new UserNotFoundException();
        }
        return new User($row);
    }

    public function loadUserByApiToken(string $token): UserInterface
    {
        $now = new DateTimeImmutable('now');
        $ttl = $this->ttl;
        $mustBeSeenAfter = $now
            ->sub(new DateInterval("PT${ttl}S"))
            ->format('Y-m-d H:i:s');
        $stmt = $this->db->prepare('SELECT * FROM user WHERE token_hash = ? AND seen_at > ?');
        $stmt->execute([
            $this->hasher->hash($token),
            $mustBeSeenAfter,
        ]);
        $row = $stmt->fetch();
        if (!$row) {
            throw new UserNotFoundException();
        }

        $stmt = $this->db->prepare('UPDATE user SET seen_at = ? WHERE user_id = ?');
        $stmt->execute([
            $now->format('Y-m-d H:i:s'),
            $row['user_id'],
        ]);

        return new User($row);
    }
}
