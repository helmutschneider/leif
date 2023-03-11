<?php declare(strict_types=1);

namespace Leif\Api;

use DateTimeImmutable;
use Leif\Database;
use Leif\Security\User;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\User\UserInterface;

final class ExpandInvoiceDatasetAction
{
    readonly Database $db;

    public function __construct(Database $db)
    {
        $this->db = $db;
    }

    public function __invoke(Request $request, UserInterface $user, int $id): Response
    {
        assert($user instanceof User);

        $dataset = static::loadAndExpandDataset($this->db, $user, $id);

        if ($dataset === null) {
            return new JsonResponse(['message' => 'Not found.'], Response::HTTP_NOT_FOUND);
        }

        return new JsonResponse($dataset, Response::HTTP_OK);
    }

    public static function loadAndExpandDataset(Database $db, User $user, int $id): ?array
    {
        $dataset = static::loadAndDecodeDataset($db, $user, $id);

        if ($dataset === null) {
            return null;
        }

        $extendsId = $dataset['extends_id'];

        while ($extendsId !== null) {
            $parent = static::loadAndDecodeDataset($db, $user, $extendsId);
            $dataset['fields'] = array_replace_recursive($parent['fields'], $dataset['fields']);
            $dataset['line_items'] = array_replace_recursive($parent['line_items'], $dataset['line_items']);
            $dataset['variables'] = array_replace_recursive($parent['variables'], $dataset['variables']);
            $extendsId = $parent['extends_id'];
        }

        $vars = $dataset['variables'];
        foreach ($vars as $key => $value) {
            // TODO: maybe we should expand recursively for all string values.
            if (!is_string($value)) {
                continue;
            }
            $vars[$key] = render($value, $vars);
        }
        $dataset['variables'] = $vars;

        $context = [
            // 'organization' => $organization,
            'variables' => $vars,
        ];

        foreach ($dataset['fields'] as $key => $field) {
            $dataset['fields'][$key]['value'] = render($field['value'], $context);
        }

        $dataset['fields'] = array_values($dataset['fields']);

        foreach ($dataset['line_items'] as $key => $field) {
            $dataset['line_items'][$key]['name'] = render($field['name'], $context);
        }

        $dataset['line_items'] = array_values($dataset['line_items']);

        return $dataset;
    }

    private static function loadAndDecodeDataset(Database $db, User $user, int $id): ?array
    {
        $dataset = $db->selectOne('SELECT * FROM invoice_dataset WHERE invoice_dataset_id = ? AND organization_id = ?', [
            $id, $user->getOrganizationId(),
        ]);

        if ($dataset === null) {
            return null;
        }

        $fields = json_decode($dataset['fields'], true);
        $keyedFields = [];

        foreach ($fields as $field) {
            if ($field['name'] === null) {
                unset($field['name']);
            }

            $key = $field['key'];
            $keyedFields[$key] = $field;
        }

        $lineItems = json_decode($dataset['line_items'], true);
        $keyedLineItems = [];

        foreach ($lineItems as $item) {
            if ($item['name'] === null) {
                unset($item['name']);
            }

            $key = $item['key'];
            $keyedLineItems[$key] = $item;
        }

        $dataset['fields'] = $keyedFields;
        $dataset['line_items'] = $keyedLineItems;
        $dataset['variables'] = json_decode($dataset['variables'], true);

        return $dataset;
    }
}
