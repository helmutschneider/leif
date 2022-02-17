<?php declare(strict_types=1);

namespace Leif\Tests\Api;

use Leif\Database;
use Leif\Security\HmacHasher;
use Leif\Tests\WebTestCase;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Component\HttpFoundation\Response;

final class DeleteVoucherTest extends WebTestCase
{
    public function testPreventsUnauthenticatedAccess(): void
    {
        $client = static::createClient();
        $client->request('DELETE', '/api/voucher/1');
        $this->assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testDeleteVoucher()
    {
        $client = static::createClient();
        $id = static::init($client);

        $client->request('DELETE', "/api/voucher/$id", [], [], [
            'HTTP_AUTHORIZATION' => '1234',
        ]);

        $this->assertResponseStatusCodeSame(Response::HTTP_NO_CONTENT);

        $db = $client->getContainer()->get(Database::class);
        $exists = $db->selectOne('SELECT 1 FROM voucher WHERE voucher_id = :id', [
            ':id' => $id,
        ]);

        $this->assertNull($exists);
    }

    private static function init(KernelBrowser $client): int
    {
        $db = $client->getContainer()->get(Database::class);
        $hasher = $client->getContainer()->get(HmacHasher::class);

        assert($db instanceof Database);
        assert($hasher instanceof HmacHasher);

        $userId = static::createUser($db, 'tester');
        static::createToken($db, $hasher->hash(hex2bin('1234')), $userId);

        return static::createVoucher($db, $userId);
    }
}
