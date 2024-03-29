<?php declare(strict_types=1);

namespace Leif\Api;

use Leif\Database;
use Leif\Security\User;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\User\UserInterface;

final class DeleteVoucherAction
{
    readonly Database $db;

    public function __construct(Database $db)
    {
        $this->db = $db;
    }

    public function __invoke(UserInterface $user, int $id)
    {
        assert($user instanceof User);

        $this->db->execute('DELETE FROM voucher WHERE voucher_id = ? AND organization_id = ?', [
            $id, $user->getOrganizationId(),
        ]);

        return new Response('', Response::HTTP_NO_CONTENT);
    }
}
