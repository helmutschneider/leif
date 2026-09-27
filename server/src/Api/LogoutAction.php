<?php

declare(strict_types=1);

namespace Leif\Api;

use Leif\Database;
use Leif\Security\HmacHasher;
use Leif\Security\User;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Core\User\UserInterface;

class LogoutAction
{
    readonly HmacHasher $hasher;
    readonly Database $db;

    public function __construct(HmacHasher $hasher, Database $db)
    {
        $this->hasher = $hasher;
        $this->db = $db;
    }

    public function __invoke(Request $request, UserInterface $user)
    {
        assert($user instanceof User);

        $cookie = $request->cookies->get('token', '');

        if ($cookie) {
            $this->db->execute('delete from token where user_id = :id and value = :hash', [
                ':id' => $user->getId(),
                ':hash' => [$this->hasher->hash($cookie), Database::PARAM_BLOB],
            ]);
        }

        $res = new RedirectResponse('/login');
        $res->headers->clearCookie('token');
        return $res;
    }
}
