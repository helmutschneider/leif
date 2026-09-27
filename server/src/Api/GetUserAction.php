<?php declare(strict_types=1);

namespace Leif\Api;

use Leif\Security\User;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Core\User\UserInterface;

final class GetUserAction
{
    public function __invoke(UserInterface $user)
    {
        assert($user instanceof User);

        return new JsonResponse([
            'user_id' => $user->getId(),
            'username' => $user->getUsername(),
            'roles' => $user->getRoles(),
        ]);
    }
}
