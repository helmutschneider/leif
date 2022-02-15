<?php declare(strict_types=1);

namespace Leif\Api;

use Leif\Database;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\User\UserInterface;

final class UpdateWorkbookAction
{
    private Database $db;

    public function __construct(Database $db)
    {
        $this->db = $db;
    }

    public function __invoke(Request $request, UserInterface $user, int $id): Response
    {
        $body = $request->toArray();
        $row = $this->db->selectOne('SELECT * FROM workbook WHERE user_id = :user_id AND workbook_id = :id', [
            ':user_id' => $user->getId(),
            ':id' => $id,
        ]);

        if (!$row) {
            return new JsonResponse(['message' => 'Not found.'], Response::HTTP_NOT_FOUND);
        }

        return $this->db->transaction(function () use ($body, $row, $id) {
            $this->db->execute('UPDATE workbook SET name = :name, year = :year WHERE workbook_id = :id', [
                ':name' => $body['name'] ?? $row['name'],
                ':year' => $body['year'] ?? $row['year'],
                ':id' => $id,
            ]);

            $this->db->execute('DELETE FROM balance_carry WHERE workbook_id = :id', [
                ':id' => $id,
            ]);

            foreach ($body['balance_carry'] ?? [] as $accountNumber => $value) {
                $this->db->execute('INSERT INTO balance_carry (account, balance, workbook_id) VALUES (?, ?, ?)', [
                    $accountNumber,
                    $value,
                    $id,
                ]);
            }

            return new JsonResponse($body, Response::HTTP_OK);
        });
    }
}
