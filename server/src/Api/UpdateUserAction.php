<?php declare(strict_types=1);

namespace Leif\Api;

use Leif\Database;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\User\UserInterface;

final class UpdateUserAction
{
    private Database $db;

    public function __construct(Database $db)
    {
        $this->db = $db;
    }

    public function __invoke(Request $request, UserInterface $user, int $id): JsonResponse
    {
        $body = $request->toArray();
        $userId = $user->getId();

        // this is mega troll but we might want some admin logic here in the future.
        if ($id !== $userId) {
            return new JsonResponse(['message' => 'Not found.'], Response::HTTP_NOT_FOUND);
        }

        $this->db->execute('UPDATE user SET carry_accounts = :accounts WHERE user_id = :id', [
            ':accounts' => $body['carry_accounts'],
            ':id' => $userId,
        ]);

        return new JsonResponse($body, Response::HTTP_OK);
    }
}
