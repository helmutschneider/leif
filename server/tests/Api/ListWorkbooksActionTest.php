<?php declare(strict_types=1);

namespace Leif\Tests\Api;

use DateTimeImmutable;
use Leif\Database;
use Leif\Security\HmacHasher;
use Leif\Security\SecretKey;
use Leif\Tests\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

final class ListWorkbooksActionTest extends WebTestCase
{
    public function testPreventsUnauthenticatedAccess(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/workbook');
        $this->assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testListsWorkbooks()
    {
        $client = static::createClient();

        $db = $client->getContainer()->get(Database::class);
        $hasher = $client->getContainer()->get(HmacHasher::class);

        assert($db instanceof Database);
        assert($hasher instanceof HmacHasher);

        $userId = static::createUser($db, 'tester');
        static::createToken($db, $hasher->hash('123'), $userId);
        $workbookId = static::createWorkbook($db, $userId);
        $voucherId = static::createVoucher($db, $workbookId);
        static::createTransaction($db, $voucherId);

        $client->request('GET', '/api/workbook', [], [], [
            'HTTP_AUTHORIZATION' => '123',
        ]);

        $this->assertResponseStatusCodeSame(Response::HTTP_OK);

        $body = json_decode($client->getResponse()->getContent(), true);

        $this->assertCount(1, $body);
        $this->assertArrayHasKey('transactions', $body[0]['vouchers'][0]);
    }
}