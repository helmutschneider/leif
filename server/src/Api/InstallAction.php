<?php declare(strict_types=1);

namespace Leif\Api;

use Leif\Database;
use Leif\Tests\DatabaseTrait;
use Leif\View;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\PasswordHasherInterface;

final class InstallAction
{
    const ERR_MISSING_USERNAME = 0;
    const ERR_MISSING_PASSWORD = 1;

    private Database $db;
    private PasswordHasherInterface $passwordHasher;

    public function __construct(Database $db, PasswordHasherInterface $passwordHasher)
    {
        $this->db = $db;
        $this->passwordHasher = $passwordHasher;
    }

    public function __invoke(Request $request): Response
    {
        if (static::isTableSchemaLoaded($this->db)) {
            return new RedirectResponse('/');
        }

        $errors = [];
        $username = '';
        $password = '';

        if ($request->isMethod('POST')) {
            $body = $request->request->all();
            $username = $body['username'] ?? '';
            $password = $body['password'] ?? '';

            if (!$username) {
                $errors[] = static::ERR_MISSING_USERNAME;
            }
            if (!$password) {
                $errors[] = static::ERR_MISSING_PASSWORD;
            }

            if ($errors === []) {
                $this->db->transaction(function () use ($username, $password) {
                    static::loadSchema($this->db);
                    $this->db->execute('INSERT INTO user (username, password_hash) VALUES  (?, ?)', [
                        $username,
                        $this->passwordHasher->hash($password),
                    ]);
                });
                return new RedirectResponse('/');
            }
        }

        $layout = new View(__DIR__ . '/../../views/layout.php');
        $html = $layout->render([
            'body' => $layout->renderChild(__DIR__ . '/../../views/install.php', [
                'errors' => $errors,
                'username' => $username,
                'password' => $password,
            ]),
        ]);

        return new Response($html, Response::HTTP_OK, [
            'Content-Type' => 'text/html',
        ]);
    }

    public static function loadSchema(Database $db): void
    {
        $schema = file_get_contents(__DIR__ . '/../../../data/sqlite.sql');
        $parts = explode(';', trim($schema));

        foreach ($parts as $part) {
            $part = trim($part);
            if (!$part) {
                continue;
            }
            $db->execute($part);
        }
    }

    public static function isTableSchemaLoaded(Database $db): bool
    {
        $ok = $db->selectOne('SELECT 1 FROM sqlite_master WHERE type = :type AND name = :name', [
            ':type' => 'table',
            ':name' => 'voucher',
        ]);
        return $ok !== null;
    }
}
