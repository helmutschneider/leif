<?php declare(strict_types=1);

namespace Leif\Security;

use DateTimeImmutable;
use DateInterval;
use Leif\Database;
use Symfony\Component\Security\Core\Exception\UserNotFoundException;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Core\User\UserProviderInterface;

final class TokenUserProvider implements UserProviderInterface
{
    private Database $db;
    private HmacHasher $hasher;
    private int $ttl;

    public function __construct(Database $db, HmacHasher $hasher, int $ttl)
    {
        $this->db = $db;
        $this->ttl = $ttl;
        $this->hasher = $hasher;
    }

    /**
     * @param UserInterface $user
     * @return UserInterface|void
     */
    public function refreshUser(UserInterface $user): UserInterface
    {
        return $user;
    }

    public function supportsClass(string $class): bool
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
        $row = $this->db->selectOne('SELECT * FROM user WHERE username = :username', [
            ':username' => $identifier,
        ]);
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

        $row = $this->db->selectOne(<<<SQL
SELECT u.*,
       t.token_id
  FROM user AS u
 INNER JOIN token AS t
    ON t.user_id = u.user_id
 WHERE t.value = :hash
   AND t.seen_at > :after
SQL,
            [
                ':hash' => $this->hasher->hash($token),
                ':after' => $mustBeSeenAfter,
            ]);

        if (!$row) {
            throw new UserNotFoundException();
        }

        $this->db->execute('UPDATE token SET seen_at = :now WHERE token_id = :id', [
            ':now' => $now->format('Y-m-d H:i:s'),
            ':id' => $row['token_id'],
        ]);

        return new User($row);
    }
}
