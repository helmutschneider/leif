<?php declare(strict_types=1);

namespace Leif\Tests\Api;

use DateTimeImmutable;
use Leif\Api\GetWorkbookAction;
use Leif\Database;
use Leif\Security\HmacHasher;
use Leif\Security\SecretKey;
use Leif\Tests\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

final class GetWorkbookTest extends WebTestCase
{
    public function testPreventsUnauthenticatedAccess(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/workbook');
        $this->assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testGetWorkbook()
    {
        $client = static::createClient();

        $db = $client->getContainer()->get(Database::class);
        $hasher = $client->getContainer()->get(HmacHasher::class);

        assert($db instanceof Database);
        assert($hasher instanceof HmacHasher);

        $userId = static::createUser($db, 'tester');
        static::createToken($db, $hasher->hash(hex2bin('1234')), $userId);
        $voucherId = static::createVoucher($db, $userId);
        static::createTransaction($db, $voucherId);

        $client->request('GET', '/api/workbook', [], [], [
            'HTTP_AUTHORIZATION' => '1234',
        ]);

        $this->assertResponseStatusCodeSame(Response::HTTP_OK);

        $body = json_decode($client->getResponse()->getContent(), true);

        $this->assertArrayHasKey('vouchers', $body);
    }

    const VOUCHERS = [
        [
            'attachments' => [],
            'created_at' => '',
            'date' => '2022-02-17',
            'is_template' => false,
            'name' => '',
            'notes' => '',
            'transactions' => [
                [
                    'account' => 1510,
                    'amount' => 100,
                    'kind' => 'credit',
                ],
                [
                    'account' => 1910,
                    'amount' => 100,
                    'kind' => 'debit',
                ],
            ],
            'updated_at' => '',
        ],
        [
            'attachments' => [],
            'created_at' => '',
            'date' => '2023-03-01',
            'is_template' => false,
            'name' => '',
            'notes' => '',
            'transactions' => [
                [
                    'account' => 1510,
                    'amount' => 250,
                    'kind' => 'credit',
                ],
                [
                    'account' => 1910,
                    'amount' => 250,
                    'kind' => 'debit',
                ],
            ],
            'updated_at' => '',
        ],
        [
            'attachments' => [],
            'created_at' => '',
            'date' => '2024-03-01',
            'is_template' => false,
            'name' => '',
            'notes' => '',
            'transactions' => [
                [
                    'account' => 1510,
                    'amount' => 500,
                    'kind' => 'credit',
                ],

                [
                    'account' => 1910,
                    'amount' => 500,
                    'kind' => 'debit',
                ],
            ],
            'updated_at' => '',
        ],
    ];

    public function testCreateAccountBalanceMapWithoutCarry(): void
    {
        $dt = new DateTimeImmutable('2022-12-31');
        $result = GetWorkbookAction::createAccountBalanceMap(static::VOUCHERS, $dt, '');

        $this->assertSame([
            1510 => -100,
            1910 => 100,
        ], $result);
    }

    public function testCreateAccountBalanceMapIncludesPreviousYearsWhenCarrying(): void
    {
        $dt = new DateTimeImmutable('2023-12-31');
        $result = GetWorkbookAction::createAccountBalanceMap(static::VOUCHERS, $dt, '1510,1910');

        $this->assertSame([
            1510 => -350,
            1910 => 350,
        ], $result);
    }

    public function testCreateAccountBalanceMapExcludesVouchersInTheFuture(): void
    {
        $dt = new DateTimeImmutable('2023-01-01');
        $result = GetWorkbookAction::createAccountBalanceMap(static::VOUCHERS, $dt, '1510,1910');

        $this->assertSame([
            1510 => -100,
            1910 => 100,
        ], $result);
    }

    public function testCreateAccountBalanceMapWorksWithWildcards(): void
    {
        $dt = new DateTimeImmutable('2023-12-31');
        $result = GetWorkbookAction::createAccountBalanceMap(static::VOUCHERS, $dt, '1*');

        $this->assertSame([
            1510 => -350,
            1910 => 350,
        ], $result);
    }

    public function testCreateAccountBalanceMapWorksWithLongListOfAccounts(): void
    {
        $dt = new DateTimeImmutable('2023-12-31');
        $result = GetWorkbookAction::createAccountBalanceMap(static::VOUCHERS, $dt, '1000,1001,1002,1510,1910');

        $this->assertSame([
            1510 => -350,
            1910 => 350,
        ], $result);
    }
}
