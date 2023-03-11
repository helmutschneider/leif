<?php declare(strict_types=1);

namespace Leif\Api;

use DateTimeImmutable;
use Leif\Database;
use Leif\Security\User;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\User\UserInterface;

final class UpdateInvoiceDatasetAction
{
    use ValidationTrait;

    readonly Database $db;

    const SQL_UPDATE = <<<SQL
UPDATE "invoice_dataset"
   SET name = :name,
       vat_rate = :vat_rate,
       currency_code = :currency_code,
       precision = :precision,
       extends_id = :extends_id,
       invoice_template_id = :invoice_template_id,
       fields = :fields,
       line_items = :line_items,
       updated_at = :updated_at
 WHERE invoice_dataset_id = :id
SQL;

    public function __construct(Database $db)
    {
        $this->db = $db;
    }

    public function __invoke(Request $request, UserInterface $user, int $id): Response
    {
        assert($user instanceof User);

        if ($err = $this->validate($request, CreateInvoiceDatasetAction::RULES)) {
            return $err;
        }

        $found = $this->db->selectOne('SELECT * FROM invoice_dataset WHERE invoice_dataset_id = ? AND organization_id = ?', [
            $id, $user->getOrganizationId(),
        ]);

        if ($found === null) {
            return new JsonResponse(['message' => 'Not found.'], Response::HTTP_NOT_FOUND);
        }

        $body = $request->toArray();

        if (!CreateInvoiceDatasetAction::ensureTemplateExists($this->db, $user, $body['invoice_template_id'])) {
            return new JsonResponse(['message' => 'Invalid template ID.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $extendsId = isset($body['extends_id']) && is_int($body['extends_id'])
            ? $body['extends_id']
            : null;

        $dt = new DateTimeImmutable('now');
        $this->db->execute(static::SQL_UPDATE, [
            ':name' => $body['name'],
            ':vat_rate' => $body['vat_rate'],
            ':currency_code' => $body['currency_code'],
            ':precision' => $body['precision'],
            ':extends_id' => $extendsId,
            ':invoice_template_id' => $body['invoice_template_id'],
            ':fields' => json_encode($body['fields'], CreateInvoiceDatasetAction::JSON_FLAGS),
            ':line_items' => json_encode($body['line_items'], CreateInvoiceDatasetAction::JSON_FLAGS),
            ':updated_at' => $dt->format('Y-m-d H:i:s'),
            ':id' => $id,
        ]);

        return new JsonResponse($body, Response::HTTP_CREATED);
    }
}
