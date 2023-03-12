<?php declare(strict_types=1);

namespace Leif\Tests\Api;

use Leif\Tests\TestCase;

final class RenderInvoiceActionTest extends TestCase
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

    public function renderProvider(): array
    {
        return [
            ['pdf', 'application/pdf'],
            ['html', 'text/html'],
        ];
    }

    /**
     * @dataProvider renderProvider
     */
    public function testRender(string $format, string $expectedContentType): void
    {
        $body = json_encode([
            'name' => 'Yee',
            'vat_rate' => 25,
            'currency_code' => 'SEK',
            'precision' => 0,
            'variables' => [],
            'invoice_template_id' => 1,
            'fields' => [],
            'line_items' => [],
        ]);

        $this->client->request('POST', "/api/invoice/render?format={$format}", [], [], [
            'HTTP_AUTHORIZATION' => '1234',
        ], $body);

        $res = $this->client->getResponse();

        $this->assertSame(200, $res->getStatusCode());

        $this->assertStringContainsString($expectedContentType, $res->headers->get('Content-Type'));
    }
}
