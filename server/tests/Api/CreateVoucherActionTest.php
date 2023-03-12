<?php declare(strict_types=1);

namespace Leif\Tests\Api;

use Leif\Tests\TestCase;
use Symfony\Component\HttpFoundation\Response;

final class CreateVoucherActionTest extends TestCase
{
    public function fixtures(): array
    {
        return [
            'organization',
            'user',
            'token',
        ];
    }

    public function testCreateTheThing()
    {
        $this->client->request('POST', '/api/voucher', [], [], ['HTTP_AUTHORIZATION' => '1234'], json_encode([
            'date' => '2022-02-14',
            'name' => 'Test voucher',
            'is_template' => false,
            'transactions' => [
                [
                    'account' => 1910,
                    'amount' => 100,
                    'kind' => 'credit',
                ],
                [
                    'account' => 2440,
                    'amount' => 100,
                    'kind' => 'debit',
                ],
            ],
            'attachments' => [
                [
                    'name' => 'my_dude.txt',
                    'mime' => 'text/plain',
                    'data' => 'yee boi',
                ],
            ],
        ]));

        $this->assertResponseStatusCodeSame(Response::HTTP_CREATED);
    }
}
