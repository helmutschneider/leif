<?php declare(strict_types=1);

namespace Leif\Api;

use PDO;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

final class IndexAction
{
    public function __construct()
    {
    }

    public function __invoke(): Response
    {
        $html = file_get_contents(
            __DIR__ . '/../../public/index.html'
        );

        return new Response($html, 200, [
            'Content-Type' => 'text/html',
        ]);
    }
}
