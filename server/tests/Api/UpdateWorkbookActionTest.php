<?php declare(strict_types=1);

namespace Leif\Tests\Api;

use Leif\Database;
use Leif\Security\HmacHasher;
use Leif\Tests\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

final class UpdateWorkbookActionTest extends WebTestCase
{
    public function testPreventsUnauthenticatedAccess(): void
    {
        $client = static::createClient();
        $client->request('PUT', '/api/workbook/1');
        $this->assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testUpdatesWorkbook()
    {
        $client = static::createClient();

        $db = $client->getContainer()->get(Database::class);
        $hasher = $client->getContainer()->get(HmacHasher::class);

        assert($db instanceof Database);
        assert($hasher instanceof HmacHasher);

        $userId = static::createUser($db, 'tester');
        static::createToken($db, $hasher->hash(hex2bin('1234')), $userId);
        $workbookId = static::createWorkbook($db, $userId);

        $body = json_encode([
            'name' => 'Bruh!',
            'balance_carry' => [
                1910 => 500,
            ],
        ]);

        $client->request('PUT', "/api/workbook/$workbookId", [], [], [
            'HTTP_AUTHORIZATION' => '1234',
        ], $body);

        $this->assertResponseStatusCodeSame(Response::HTTP_OK);
    }
}