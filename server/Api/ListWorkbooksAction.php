<?php declare(strict_types=1);

namespace Leif\Api;

use Leif\Security\User;
use PDO;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\User\UserInterface;

final class ListWorkbooksAction
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function __invoke(UserInterface $user): Response
    {
        $stmt = $this->db->prepare('SELECT * FROM workbook WHERE user_id = ?');
        $stmt->execute([
            $user->getId(),
        ]);

        return new JsonResponse($stmt->fetchAll());
    }
}
