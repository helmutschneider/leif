<?php declare(strict_types=1);

namespace Leif\Api;

use DateTimeImmutable;
use Leif\Database;
use PDO;
use Leif\Security\HmacHasher;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\PasswordHasherInterface;

final class LoginAction
{
    const ERR_MISSING_CREDENTIALS = [
        'message' => '\'username\' and \'password\' are required.',
    ];
    const ERR_BAD_CREDENTIALS = [
        'message' => 'Invalid username or password.',
    ];

    private Database $db;
    private PasswordHasherInterface $passwordHasher;
    private HmacHasher $tokeHasher;

    public function __construct(Database $db, PasswordHasherInterface $hasher, HmacHasher $tokeHasher)
    {
        $this->db = $db;
        $this->passwordHasher = $hasher;
        $this->tokeHasher = $tokeHasher;
    }

    public function __invoke(Request $request): Response
    {
        $body = $request->toArray();

        if (!isset($body['username'], $body['password'])) {
            return new JsonResponse(static::ERR_MISSING_CREDENTIALS, Response::HTTP_UNPROCESSABLE_ENTITY);
        }

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
        $token = bin2hex(random_bytes(32));
        $this->db->execute('UPDATE user SET token_hash = :hash, seen_at = :now WHERE user_id = :id', [
            ':hash' => $this->tokeHasher->hash($token),
            ':now' => (new DateTimeImmutable('now'))->format('Y-m-d H:i:s'),
            ':id' => $row['user_id'],
        ]);

        return new JsonResponse([
            'user_id' => $row['user_id'],
            'username' => $row['username'],
            'token' => $token,
        ], Response::HTTP_OK);
    }
}
