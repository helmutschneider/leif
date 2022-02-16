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
    const ERR_MISSING_WORKBOOK_NAME = 2;

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
        $workbookName = '';

        if ($request->isMethod('POST')) {
            $body = $request->request->all();
            $username = $body['username'] ?? '';
            $workbookName = $body['workbook_name'] ?? '';
            $password = $body['password'] ?? '';

            if (!$username) {
                $errors[] = static::ERR_MISSING_USERNAME;
            }
            if (!$password) {
                $errors[] = static::ERR_MISSING_PASSWORD;
            }
            if (!$workbookName) {
                $errors[] = static::ERR_MISSING_WORKBOOK_NAME;
            }

            if ($errors === []) {
                $this->db->transaction(function () use ($username, $password, $workbookName) {
                    DatabaseTrait::loadSchema($this->db);
                    $this->db->execute('INSERT INTO user (username, password_hash) VALUES  (?, ?)', [
                        $username,
                        $this->passwordHasher->hash($password),
                    ]);
                    $this->db->execute('INSERT INTO workbook (name, year, user_id) VALUES (?, ?, ?)', [
                        $workbookName,
                        date('Y'),
                        $this->db->getLastInsertId(),
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
                'workbookName' => $workbookName,
            ]),
        ]);

        return new Response($html, Response::HTTP_OK, [
            'Content-Type' => 'text/html',
        ]);
    }

    public static function isTableSchemaLoaded(Database $db): bool
    {
        $ok = $db->selectOne('SELECT 1 FROM sqlite_schema WHERE type = :type AND name = :name', [
            ':type' => 'table',
            ':name' => 'workbook',
        ]);
        return $ok !== null;
    }
}
