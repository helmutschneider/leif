<?php declare(strict_types=1);

namespace Leif\Api;

use Leif\Database;
use Leif\View;
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

        $layout = new View(__DIR__ . '/../../views/layout.php');
        $html = $layout->render([
            'body' => $layout->renderChild(__DIR__ . '/../../views/app.php'),
        ]);

        return new Response($html, Response::HTTP_OK, [
            'Content-Type' => 'text/html',
        ]);
    }
}
