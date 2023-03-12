<?php declare(strict_types=1);

namespace Leif\Tests\Api;

use Leif\Tests\TestCase;
use Symfony\Component\HttpFoundation\Response;

final class DeleteVoucherTest extends TestCase
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
        $this->client->request('DELETE', '/api/voucher/1');
        $this->assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testDeleteVoucher()
    {
        $exists = $this->db->selectOne('SELECT 1 FROM voucher WHERE voucher_id = :id', [
            ':id' => 1,
        ]);
        $this->assertNotNull($exists);

        $this->client->request('DELETE', "/api/voucher/1", [], [], [
            'HTTP_AUTHORIZATION' => '1234',
        ]);

        $this->assertResponseStatusCodeSame(Response::HTTP_NO_CONTENT);

        $exists = $this->db->selectOne('SELECT 1 FROM voucher WHERE voucher_id = :id', [
            ':id' => 1,
        ]);

        $this->assertNull($exists);
    }
}
