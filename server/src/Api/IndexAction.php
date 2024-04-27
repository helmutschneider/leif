<?php declare(strict_types=1);

namespace Leif\Api;

use Leif\Database;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

final class IndexAction
{
    private Database $db;

    public function __construct(Database $db)
    {
        $this->db = $db;
    }

    public function __invoke(Request $request): Response
    {
        if (!InstallAction::isTableSchemaLoaded($this->db)) {
            return new RedirectResponse('/install');
        }

        $html = render_file('app.twig');

        return new Response($html, Response::HTTP_OK, [
            'Content-Type' => 'text/html',
        ]);
    }
}
