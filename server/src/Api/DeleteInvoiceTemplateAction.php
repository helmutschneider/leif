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

    readonly Database $db;

    public function __construct(Database $db)
    {
        $this->db = $db;
    }

    public function __invoke(Request $request, UserInterface $user, int $id): Response
    {
        assert($user instanceof User);

        $this->db->execute('DELETE FROM invoice_template WHERE invoice_template_id = ? and organization_id = ?', [
            $id, $user->getOrganizationId()
        ]);

        return new Response('', Response::HTTP_NO_CONTENT);
    }
}
