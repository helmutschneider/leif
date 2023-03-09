<?php declare(strict_types=1);

namespace Leif\Api;

use Leif\Database;
use Leif\Security\User;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\User\UserInterface;

final class CreateInvoiceDatasetAction
{
    use ValidationTrait;

    public const JSON_FLAGS = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES;
    public const RULES = [
        'name' => 'required|string|min:1',
        'vat_rate' => 'required|float',
        'currency_code' => 'required|string|min:3',
        'precision' => 'required|integer',
        'extends_id' => 'integer|null',
        'invoice_template_id' => 'required|integer',

        'fields' => 'array',
        'fields.*.name' => 'required|string|min:1',
        'fields.*.key' => 'string',
        'fields.*.value' => 'string',
        'fields.*.sorting' => 'numeric',
        'fields.*.is_editable' => 'boolean',
        'fields.*.is_visible' => 'boolean',

        'line_items' => 'array',
        'line_items.*.name' => 'required|string|min:1',
        'line_items.*.key' => 'string',
        'line_items.*.kind' => 'required|string|min:1',
        'line_items.*.price' => 'numeric',
        'line_items.*.quantity' => 'numeric',
    ];

    readonly Database $db;

    const SQL_INSERT = <<<SQL
INSERT INTO "invoice_dataset" (
  "name",
  "vat_rate",
  "currency_code",
  "precision",
  "extends_id",
  "invoice_template_id",
  "fields",
  "line_items",
  "organization_id"
) VALUES (:name, :vat_rate, :currency_code, :precision, :extends_id, :invoice_template_id, :fields, :line_items, :organization_id)
SQL;

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

        if (!static::ensureTemplateIsOwnedByUser($this->db, $user, $body['invoice_template_id'])) {
            return new JsonResponse(['message' => 'Invalid template ID.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $extendsId = isset($body['extends_id']) && is_int($body['extends_id'])
            ? $body['extends_id']
            : null;

        $this->db->execute(static::SQL_INSERT, [
            ':name' => $body['name'],
            ':vat_rate' => $body['vat_rate'],
            ':currency_code' => $body['currency_code'],
            ':precision' => $body['precision'],
            ':extends_id' => $extendsId,
            ':invoice_template_id' => $body['invoice_template_id'],
            ':fields' => json_encode($body['fields'], static::JSON_FLAGS),
            ':line_items' => json_encode($body['line_items'], static::JSON_FLAGS),
            ':organization_id' => $user->getOrganizationId(),
        ]);

        $body['invoice_dataset_id'] = $this->db->getLastInsertId();

        return new JsonResponse($body, Response::HTTP_CREATED);
    }

    public static function ensureTemplateIsOwnedByUser(Database $db, UserInterface $user, int $templateId): bool
    {
        assert($user instanceof User);

        $found = $db->selectOne('SELECT 1 FROM invoice_template WHERE invoice_template_id = ? AND organization_id = ?', [
            $templateId, $user->getOrganizationId(),
        ]);

        return $found !== null;
    }
}
