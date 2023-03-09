<?php declare(strict_types=1);

namespace Leif\Api;

use Leif\Database;
use Leif\Security\User;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Security\Core\User\UserInterface;

final class UpdateInvoiceTemplateAction
{
    use ValidationTrait;

    const RULES = [
        'name' => 'string|min:1',
        'data' => 'string|min:1',
    ];
    const SQL_FIND_TEMPLATE = <<<SQL
SELECT i.*
  FROM "invoice_template" AS i
 WHERE i.invoice_template_id = :id
   AND i.organization_id = :organization_id
SQL;
    const SQL_UPDATE_TEMPLATE = <<<SQL
UPDATE "invoice_template"
   SET "name" = :name,
       "data" = :data
 WHERE "invoice_template_id" = :id
SQL;

    readonly Database $db;

    public function __construct(Database $db)
    {
        $this->db = $db;
    }

    public function __invoke(Request $request, UserInterface $user, int $id): Response
    {
        assert($user instanceof User);

        if ($err = $this->validate($request, static::RULES)) {
            return $err;
        }

        $template = $this->db->selectOne(static::SQL_FIND_TEMPLATE, [
            ':id' => $id,
            ':organization_id' => $user->getOrganizationId(),
        ]);

        if ($template === null) {
            return new JsonResponse(['message' => 'Not found.'], Response::HTTP_NOT_FOUND);
        }

        $body = $request->toArray();

        $this->db->execute(static::SQL_UPDATE_TEMPLATE, [
            ':name' => $body['name'],
            ':data' => $body['data'],
            ':id' => $id,
        ]);

        return new JsonResponse($body, Response::HTTP_OK);
    }
}
