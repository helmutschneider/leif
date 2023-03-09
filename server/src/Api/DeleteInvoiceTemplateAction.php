<?php declare(strict_types=1);

namespace Leif\Api;

use Leif\Database;
use Leif\Security\User;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Security\Core\User\UserInterface;

final class DeleteInvoiceTemplateAction
{
    use ValidationTrait;

    const SQL_FIND_TEMPLATE = <<<SQL
SELECT i.*
  FROM "invoice_template" AS i
 WHERE i.invoice_template_id = :id
   AND i.organization_id = :organization_id
SQL;

    readonly Database $db;

    public function __construct(Database $db)
    {
        $this->db = $db;
    }

    public function __invoke(Request $request, UserInterface $user, int $id): Response
    {
        assert($user instanceof User);

        $template = $this->db->selectOne(static::SQL_FIND_TEMPLATE, [
            ':id' => $id,
            ':organization_id' => $user->getOrganizationId(),
        ]);

        if ($template === null) {
            return new JsonResponse(['message' => 'Not found.'], Response::HTTP_NOT_FOUND);
        }

        $this->db->execute('DELETE FROM invoice_template WHERE invoice_template_id = ?', [$id]);

        return new Response('', Response::HTTP_NO_CONTENT);
    }
}
