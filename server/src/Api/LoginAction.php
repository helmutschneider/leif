<?php declare(strict_types=1);

namespace Leif\Api;

use DateTimeImmutable;
use DateInterval;
use Leif\Database;
use Leif\Security\HmacHasher;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\PasswordHasherInterface;

final class LoginAction
{
    use ValidationTrait;

    const ERR_BAD_CREDENTIALS = [
        'message' => 'Invalid username or password.',
    ];
    const RULES = [
        'password' => 'required|string|min:1',
        'username' => 'required|string|min:1',
    ];

    private Database $db;
    private PasswordHasherInterface $passwordHasher;
    private HmacHasher $tokenHasher;
    private int $ttl;

    public function __construct(Database $db, PasswordHasherInterface $hasher, HmacHasher $tokenHasher, int $ttl)
    {
        $this->db = $db;
        $this->passwordHasher = $hasher;
        $this->tokenHasher = $tokenHasher;
        $this->ttl = $ttl;
    }

    public function __invoke(Request $request): Response
    {
        if ($err = $this->validate($request, static::RULES)) {
            return $err;
        }

        $body = $request->toArray();
        $username = (string) ($body['username'] ?: '');
        $password = (string) ($body['password'] ?: '');

        $row = $this->db->selectOne('SELECT * FROM user WHERE username = :name', [
            ':name' => $username,
        ]);

        if (!$row) {
            return new JsonResponse(static::ERR_BAD_CREDENTIALS, Response::HTTP_UNAUTHORIZED);
        }

        if (!$this->passwordHasher->verify($row['password_hash'], $password)) {
            return new JsonResponse(static::ERR_BAD_CREDENTIALS, Response::HTTP_UNAUTHORIZED);
        }

        if ($this->passwordHasher->needsRehash($row['password_hash'])) {
            $this->db->execute('UPDATE user SET password_hash = ? WHERE user_id = ?', [
                $this->passwordHasher->hash($password),
                $row['user_id'],
            ]);
        }

        $token = bin2hex(random_bytes(32));
        $now = new DateTimeImmutable('now');

        $this->db->execute('INSERT INTO token (value, seen_at, user_id) VALUES (?, ?, ?)', [
            [$this->tokenHasher->hash($token), Database::PARAM_BLOB],
            $now->format('Y-m-d H:i:s'),
            $row['user_id'],
        ]);

        // do some garbage collection of expired tokens.
        $ttl = $this->ttl;
        $mustBeSeenAfter = $now
            ->sub(new DateInterval("PT{$ttl}S"))
            ->format('Y-m-d H:i:s');

        $this->db->execute('DELETE FROM token WHERE seen_at < :after', [
            ':after' => $mustBeSeenAfter,
        ]);

        return new JsonResponse([
            'user_id' => $row['user_id'],
            'username' => $row['username'],
            'role' => $row['role'],
            'token' => $token,
        ], Response::HTTP_OK);
    }
}
