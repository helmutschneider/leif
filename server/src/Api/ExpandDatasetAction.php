<?php declare(strict_types=1);

namespace Leif\Api;

use DateTimeImmutable;
use Leif\Database;
use Leif\Security\User;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\User\UserInterface;

final class ExpandDatasetAction
{
    readonly Database $db;

    public function __construct(Database $db)
    {
        $this->db = $db;
    }

    public function __invoke(Request $request, UserInterface $user, int $id): Response
    {
        assert($user instanceof User);

        $dataset = $this->db->selectOne('SELECT * FROM invoice_dataset WHERE invoice_dataset_id = ? AND organization_id = ?', [
            $id, $user->getOrganizationId(),
        ]);

        if ($dataset === null) {
            return new JsonResponse(['message' => 'Not found.'], Response::HTTP_NOT_FOUND);
        }

        $dataset['fields'] = json_decode($dataset['fields'], true);
        $dataset['line_items'] = json_decode($dataset['line_items'], true);
        $dataset['variables'] = json_decode($dataset['variables'], true);

        $twigLoader = new \Twig\Loader\ArrayLoader();
        $twig = new \Twig\Environment($twigLoader, [
            'cache' => false,
            'strict_variables' => true,
        ]);

        $vars = $dataset['variables'];
        foreach ($vars as $key => $value) {
            $template = $twig->createTemplate($value);
            $vars[$key] = $twig->render($template, $vars);
        }
        $dataset['variables'] = $vars;

        $fields = $dataset['fields'];

        foreach ($fields as $key => $field) {
            $template = $twig->createTemplate($field['value']);
            $field['value'] = $twig->render($template, $vars);
            $fields[$key] = $field;
        }

        $dataset['fields'] = $fields;

        return new JsonResponse($dataset, Response::HTTP_OK);
    }
}
