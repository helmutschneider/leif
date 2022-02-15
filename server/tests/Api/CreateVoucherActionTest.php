<?php declare(strict_types=1);

namespace Leif\Tests\Api;

use Leif\Database;
use Leif\Security\HmacHasher;
use Leif\Tests\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

final class CreateVoucherActionTest extends WebTestCase
{
    public function testCreateTheThing()
    {
        $client = static::createClient();

        $db = $client->getContainer()->get(Database::class);
        $hasher = $client->getContainer()->get(HmacHasher::class);

        assert($db instanceof Database);
        assert($hasher instanceof HmacHasher);

        $userId = static::createUser($db, 'tester');
        static::createToken($db, $hasher->hash(hex2bin('1234')), $userId);
        $workbookId = static::createWorkbook($db, $userId);

        $client->request('POST', '/api/voucher', [], [], ['HTTP_AUTHORIZATION' => '1234'], json_encode([
            'date' => '2022-02-14',
            'name' => 'Test voucher',
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
            'workbook_id' => $workbookId,
        ]));

        $this->assertResponseStatusCodeSame(Response::HTTP_CREATED);
    }
}
