<?php declare(strict_types=1);

namespace Leif\Tests\Api;

use Leif\Tests\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

final class InvoiceTemplateTest extends WebTestCase
{
    public function testCreateInvoiceTemplate(): void
    {
        $client = static::createClient();
        static::createUserWithToken($client, 'tester', '1234');

        $body = json_encode([
            'name' => 'yee!',
            'body' => 'boi!',
        ]);
        $client->request('POST', '/api/invoice-template', [], [], [
            'HTTP_AUTHORIZATION' => '1234',
        ], $body);

        $this->assertResponseStatusCodeSame(Response::HTTP_CREATED);
    }
}
