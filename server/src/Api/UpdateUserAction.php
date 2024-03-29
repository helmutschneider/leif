<?php declare(strict_types=1);

namespace Leif\Api;

use Leif\Database;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\PasswordHasherInterface;
use Symfony\Component\Security\Core\User\UserInterface;

final class UpdateUserAction
{
    use ValidationTrait;

    const RULES = [
        'username' => 'string|min:1',
        'password' => 'string',
        'organization' => 'array',
        'organization.carry_accounts' => 'string',
        'organization.name' => 'string|min:1',
    ];

    private Database $db;
    private PasswordHasherInterface $passwordHasher;

    public function __construct(Database $db, PasswordHasherInterface $passwordHasher)
    {
        $this->db = $db;
        $this->passwordHasher = $passwordHasher;
    }

    public function __invoke(Request $request, UserInterface $user, int $id): Response
    {
        if ($err = $this->validate($request, static::RULES)) {
            return $err;
        }

        $body = $request->toArray();
        $userId = $user->getId();

        // this is mega troll but we might want some admin logic here in the future.
        if ($id !== $userId) {
            return new JsonResponse(['message' => 'Not found.'], Response::HTTP_NOT_FOUND);
        }

        $found = $this->db->selectOne('SELECT * FROM user WHERE user_id = :user_id', [
            ':user_id' => $userId,
        ]);

        $this->db->execute('UPDATE user SET password_hash = :password_hash WHERE user_id = :user_id', [
            ':password_hash' => empty($body['password'])
                ? $found['password_hash']
                : $this->passwordHasher->hash($body['password']),
            ':user_id' => $userId,
        ]);

        $this->db->execute('UPDATE organization SET name = :name, carry_accounts = :carry_accounts WHERE organization_id = :id', [
            ':name' => $body['organization']['name'],
            ':carry_accounts' => $body['organization']['carry_accounts'],
            ':id' => $user->getOrganizationId(),
        ]);

        return new JsonResponse($body, Response::HTTP_OK);
    }
}
