<?php declare(strict_types=1);

namespace Leif\Api;

use Leif\Database;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\User\UserInterface;

final class GetAttachmentAction
{
    const SQL_GET_ATTACHMENT = <<<SQL
SELECT a.*
  FROM attachment AS a
 INNER JOIN voucher AS v
    ON v.voucher_id = a.voucher_id
 WHERE a.attachment_id = :id
   AND v.user_id = :user_id
SQL;

    private Database $db;

    public function __construct(Database $db)
    {
        $this->db = $db;
    }

    public function __invoke(UserInterface $user, int $id): Response
    {
        $row = $this->db->selectOne(static::SQL_GET_ATTACHMENT, [
            ':id' => $id,
            ':user_id' => $user->getId(),
        ]);

        if (!$row) {
            return new JsonResponse(['message' => 'Not found.'], Response::HTTP_NOT_FOUND);
        }

        return new Response($row['data'], Response::HTTP_OK, [
            'Content-Type' => $row['mime'],
            'Content-Disposition' => sprintf('inline; filename="%s"', $row['name']),
        ]);
    }
}
