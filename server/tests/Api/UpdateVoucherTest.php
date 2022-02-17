<?php declare(strict_types=1);

namespace Leif\Tests\Api;

use Leif\Api\CreateVoucherAction;
use Leif\Database;
use Leif\Security\HmacHasher;
use Leif\Tests\WebTestCase;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Component\HttpFoundation\Response;

final class UpdateVoucherTest extends WebTestCase
{
    public function testPreventsUnauthenticatedAccess(): void
    {
        $client = static::createClient();
        $client->request('PUT', '/api/voucher/1');
        $this->assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testUpdateVoucherWithoutModifyingAttachments()
    {
        $client = static::createClient();
        $voucherId = static::init($client);

        $body = json_encode([
            'name' => 'My name!',
            'transactions' => [
                [
                    'account' => 1910,
                    'amount' => 100,
                    'kind' => 'debit',
                ],
                [
                    'account' => 1910,
                    'amount' => 100,
                    'kind' => 'credit',
                ],
            ],
            'attachments' => [
                [
                    'attachment_id' => 1,
                ],
            ],
        ]);

        $client->request('PUT', "/api/voucher/$voucherId", [], [], [
            'HTTP_AUTHORIZATION' => '1234',
        ], $body);

        $this->assertResponseStatusCodeSame(Response::HTTP_OK);

        $db = $client->getContainer()->get(Database::class);

        $transactions = $db->selectAll('SELECT * FROM "transaction" WHERE voucher_id = :id', [
            ':id' => $voucherId,
        ]);

        $this->assertCount(2, $transactions);

        $this->assertEquals(100, $transactions[0]['amount']);
        $this->assertEquals(CreateVoucherAction::VOUCHER_KIND_DEBIT, $transactions[0]['kind']);
        $this->assertEquals(100, $transactions[1]['amount']);
        $this->assertEquals(CreateVoucherAction::VOUCHER_KIND_CREDIT, $transactions[1]['kind']);

        $attachments = $db->selectAll('SELECT attachment_id FROM attachment WHERE voucher_id = :id', [
            ':id' => $voucherId,
        ]);

        $this->assertCount(1, $attachments);
        $this->assertEquals(1, $attachments[0]['attachment_id']);
    }

    public function testUpdateVoucherWhereAttachmentIsDeletedAndAnotherAdded()
    {
        $client = static::createClient();
        $voucherId = static::init($client);

        $body = json_encode([
            'name' => 'My name!',
            'attachments' => [
                [
                    'name' => 'bro.txt',
                    'mime' => 'text/plain',
                    'data' => 'Hello World',
                ],
            ],
        ]);

        $client->request('PUT', "/api/voucher/$voucherId", [], [], [
            'HTTP_AUTHORIZATION' => '1234',
        ], $body);

        $this->assertResponseStatusCodeSame(Response::HTTP_OK);

        $db = $client->getContainer()->get(Database::class);

        $attachments = $db->selectAll('SELECT attachment_id FROM attachment WHERE voucher_id = :id', [
            ':id' => $voucherId,
        ]);

        $this->assertCount(1, $attachments);
        $this->assertEquals(2, $attachments[0]['attachment_id']);
    }

    private static function init(KernelBrowser $client): int
    {
        $db = $client->getContainer()->get(Database::class);
        $hasher = $client->getContainer()->get(HmacHasher::class);

        assert($db instanceof Database);
        assert($hasher instanceof HmacHasher);

        $userId = static::createUser($db, 'tester');
        static::createToken($db, $hasher->hash(hex2bin('1234')), $userId);
        $voucherId = static::createVoucher($db, $userId);

        static::createAttachment($db, $voucherId);

        return $voucherId;
    }
}
