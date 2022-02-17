<?php declare(strict_types=1);

namespace Leif\Api;

use Leif\Database;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\User\UserInterface;

final class DeleteVoucherAction
{
    const SQL_VOUCHER_EXISTS = <<<SQL
SELECT 1
  FROM voucher AS v
 WHERE v.voucher_id = :id
   AND v.user_id = :user_id
SQL;

    private Database $db;

    public function __construct(Database $db)
    {
        $this->db = $db;
    }

    public function __invoke(UserInterface $user, int $id)
    {
        $found = $this->db->selectOne(static::SQL_VOUCHER_EXISTS, [
            ':user_id' => $user->getId(),
            ':id' => $id,
        ]);

        if ($found === null) {
            return new JsonResponse(['message' => 'Not found.'], Response::HTTP_NOT_FOUND);
        }

        $this->db->execute('DELETE FROM voucher WHERE voucher_id = :id', [
            ':id' => $id,
        ]);

        return new Response('', Response::HTTP_NO_CONTENT);
    }
}
