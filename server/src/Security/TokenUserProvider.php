<?php declare(strict_types=1);

namespace Leif\Security;

use DateTimeImmutable;
use DateInterval;
use Leif\Database;
use Symfony\Component\Security\Core\Exception\BadCredentialsException;
use Symfony\Component\Security\Core\Exception\UserNotFoundException;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Core\User\UserProviderInterface;

final class TokenUserProvider implements UserProviderInterface
{
    private Database $db;
    private HmacHasher $hasher;
    private int $ttl;
    private DateTimeImmutable $now;

    public function __construct(Database $db, HmacHasher $hasher, int $ttl, ?DateTimeImmutable $now = null)
    {
        $this->db = $db;
        $this->ttl = $ttl;
        $this->hasher = $hasher;
        $this->now = $now ?? new DateTimeImmutable('now');
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
        if (!preg_match('/^[a-f0-9]+$/i', $token)) {
            throw new BadCredentialsException('The token must be a hex encoded string.');
        }

        $ttl = $this->ttl;
        $mustBeSeenAfter = $this->now
            ->sub(new DateInterval("PT${ttl}S"))
            ->format('Y-m-d H:i:s');

        $bytes = hex2bin($token);

        // this query is susceptible to timing attacks but I'm not really
        // concerned about that right now. the tokens are so large that it
        // shouldn't be a problem.
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
                ':hash' => [$this->hasher->hash($bytes), Database::PARAM_BLOB],
                ':after' => $mustBeSeenAfter,
            ]);

        if (!$row) {
            throw new UserNotFoundException();
        }

        $this->db->execute('UPDATE token SET seen_at = :now WHERE token_id = :id', [
            ':now' => $this->now->format('Y-m-d H:i:s'),
            ':id' => $row['token_id'],
        ]);

        return new User($row);
    }
}
