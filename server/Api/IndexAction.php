<?php declare(strict_types=1);

namespace Leif\Api;

use Symfony\Component\HttpFoundation\Response;

final class IndexAction
{
    public function __invoke(): Response
    {
        $html = file_get_contents(
            __DIR__ . '/../../client/index.html'
        );

        return new Response($html, Response::HTTP_OK, [
            'Content-Type' => 'text/html',
        ]);
    }
}
