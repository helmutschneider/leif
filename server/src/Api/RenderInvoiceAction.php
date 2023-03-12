<?php declare(strict_types=1);

namespace Leif\Api;

use Leif\Database;
use Leif\Invoice\InvoiceDataset;
use Leif\Security\User;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\User\UserInterface;

final class RenderInvoiceAction
{
    use ValidationTrait;

    readonly Database $db;

    public function __construct(Database $db)
    {
        $this->db = $db;
    }

    public function __invoke(Request $request, UserInterface $user): Response
    {
        assert($user instanceof User);

        if ($err = $this->validate($request, CreateInvoiceDatasetAction::RULES)) {
            return $err;
        }

        $format = $request->query->get('format', 'pdf');
        $body = $request->toArray();
        $templateId = $body['invoice_template_id'];
        $template = $this->db->selectOne(
            'SELECT * FROM invoice_template WHERE invoice_template_id = ? AND organization_id = ?',
            [$templateId, $user->getOrganizationId()]
        );
        $organization = $this->db->selectOne('SELECT * FROM organization WHERE organization_id = ?', [
            $user->getOrganizationId()
        ]);

        $html = $template['body'];
        $html = preg_replace('/>\s+</', '><', $html);
        $context = [
            'invoice' => InvoiceDataset::fromArray($body),
            'organization' => $organization,
            'variables' => $body['variables'],
        ];
        $html = render($html, $context);

        switch ($format) {
            case 'html':
                return new Response($html, Response::HTTP_OK, [
                    'Content-Type' => 'text/html',
                ]);
            case 'pdf': {
                $dompdf = new \Dompdf\Dompdf([
                    'defaultFont' => 'helvetica',
                    'defaultPaperSize' => 'a4',
                    'defaultPaperOrientation' => 'portrait',
                    'isJavascriptEnabled' => false,
                    'dpi' => 72,
                ]);

                $dompdf->loadHtml($html);
                $dompdf->render();
                $result = $dompdf->output();

                return new Response($result, Response::HTTP_OK, [
                    'Content-Type' => 'application/pdf',
                ]);
            }
        }

        throw new \RuntimeException('wut');
    }
}
