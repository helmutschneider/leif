<?php declare(strict_types=1);

namespace Leif\Api;

use DateTimeImmutable;
use DateInterval;
use Leif\Database;
use Leif\Security\HmacHasher;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\PasswordHasherInterface;

final class LoginAction
{
    use ValidationTrait;

    const ERR_BAD_CREDENTIALS = 'Invalid username or password.';
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
        if ($request->isMethod('GET')) {
            $html = render_file('login.twig', [
                '_username' => '',
                'error' => '',
            ]);

            return new Response($html, Response::HTTP_OK, [
                'Content-Type' => 'text/html',
            ]);
        }

        $username = $request->request->get('_username');
        $password = $request->request->get('_password');

        $row = $this->db->selectOne('SELECT * FROM user WHERE username = :name', [
            ':name' => $username,
        ]);

        if (!$row || !$this->passwordHasher->verify($row['password_hash'], $password)) {
            $html = render_file('login.twig', [
                '_username' => $username,
                'error' => static::ERR_BAD_CREDENTIALS,
            ]);

            return new Response($html, Response::HTTP_UNAUTHORIZED, [
                'Content-Type' => 'text/html',
            ]);
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

        $res = new RedirectResponse('/');
        $cookie = Cookie::create('token')
            ->withValue($token)
            ->withHttpOnly(true)
            ->withSecure($request->isSecure())
            ->withDomain($request->getHost());

        $res->headers->setCookie($cookie);

        return $res;
    }
}
