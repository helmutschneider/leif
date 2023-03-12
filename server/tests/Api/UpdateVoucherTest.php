<?php declare(strict_types=1);

namespace Leif\Tests\Api;

use Leif\Api\CreateVoucherAction;
use Leif\Database;
use Leif\Security\HmacHasher;
use Leif\Tests\TestCase;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Component\HttpFoundation\Response;

final class UpdateVoucherTest extends TestCase
{
    public function fixtures(): array
    {
        return [
            'organization',
            'user',
            'token',
            'voucher',
        ];
    }

    public function testPreventsUnauthenticatedAccess(): void
    {
        $this->client->request('PUT', '/api/voucher/1');
        $this->assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testUpdateVoucherWithoutModifyingAttachments()
    {
        static::createAttachment($this->db, 1);

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

        $this->client->request('PUT', "/api/voucher/1", [], [], [
            'HTTP_AUTHORIZATION' => '1234',
        ], $body);

        $this->assertResponseStatusCodeSame(Response::HTTP_OK);

        $transactions = $this->db->selectAll('SELECT * FROM "transaction" WHERE voucher_id = :id', [
            ':id' => 1,
        ]);

        $this->assertCount(2, $transactions);

        $this->assertEquals(100, $transactions[0]['amount']);
        $this->assertEquals(CreateVoucherAction::VOUCHER_KIND_DEBIT, $transactions[0]['kind']);
        $this->assertEquals(100, $transactions[1]['amount']);
        $this->assertEquals(CreateVoucherAction::VOUCHER_KIND_CREDIT, $transactions[1]['kind']);

        $attachments = $this->db->selectAll('SELECT attachment_id FROM attachment WHERE voucher_id = :id', [
            ':id' => 1,
        ]);

        $this->assertCount(1, $attachments);
        $this->assertEquals(1, $attachments[0]['attachment_id']);
    }

    public function testUpdateVoucherWhereAttachmentIsDeletedAndAnotherAdded()
    {
        static::createAttachment($this->db, 1);

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

        $this->client->request('PUT', "/api/voucher/1", [], [], [
            'HTTP_AUTHORIZATION' => '1234',
        ], $body);

        $this->assertResponseStatusCodeSame(Response::HTTP_OK);

        $attachments = $this->db->selectAll('SELECT attachment_id FROM attachment WHERE voucher_id = :id', [
            ':id' => 1,
        ]);

        $this->assertCount(1, $attachments);
        $this->assertEquals(2, $attachments[0]['attachment_id']);
    }
}
