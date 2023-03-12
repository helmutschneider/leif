<?php declare(strict_types=1);

namespace Leif\Tests\Api;

use Leif\Api\ExpandInvoiceDatasetAction;
use Leif\Database;
use Leif\Security\User;
use Leif\Tests\TestCase;
use Leif\Tests\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

final class InvoiceTemplateTest extends TestCase
{
    public function fixtures(): array
    {
        return [
            'organization',
            'user',
            'token',
            'invoice_template',
        ];
    }

    public function testCreateInvoiceTemplate(): void
    {
        $body = json_encode([
            'name' => 'yee!',
            'body' => 'boi!',
        ]);
        $this->client->request('POST', '/api/invoice-template', [], [], [
            'HTTP_AUTHORIZATION' => '1234',
        ], $body);

        $this->assertResponseStatusCodeSame(Response::HTTP_CREATED);
    }
}
