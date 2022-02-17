<?php declare(strict_types=1);

namespace Leif\Api;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

final class GetAccountPlan
{
    const ACCOUNT_PLANS = [
        1 => __DIR__ . '/../../../data/accounts-2022.php',
    ];

    public function __invoke(Request $request, int $id): Response
    {
        $path = static::ACCOUNT_PLANS[$id] ?? null;

        if ($path === null) {
            return new JsonResponse(['message' => 'Not found.'], Response::HTTP_NOT_FOUND);
        }

        $data = require $path;
        return new JsonResponse($data, Response::HTTP_OK);
    }
}
