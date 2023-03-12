<?php declare(strict_types=1);

namespace Leif\Api;

use Leif\Database;
use Leif\Security\User;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\User\UserInterface;

final class CreateInvoiceTemplateAction
{
    use ValidationTrait;

    const RULES = [
        'name' => 'required|string|min:1',
        'body' => 'required|string|min:1',
    ];

    readonly Database $db;

    public function __construct(Database $db)
    {
        $this->db = $db;
    }

    public function __invoke(Request $request, UserInterface $user): Response
    {
        assert($user instanceof User);

        if ($err = $this->validate($request, static::RULES)) {
            return $err;
        }

        $body = $request->toArray();

        $this->db->execute('INSERT INTO "invoice_template" ("name", "body", "organization_id") VALUES (?, ?, ?)', [
            $body['name'],
            $body['body'],
            $user->getOrganizationId(),
        ]);

        $response = $body;
        $response['invoice_template_id'] = $this->db->getLastInsertId();

        return new JsonResponse($response, Response::HTTP_CREATED);
    }
}
