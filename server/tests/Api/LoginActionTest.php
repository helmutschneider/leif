<?php declare(strict_types=1);

namespace Leif\Tests\Api;

use Leif\Database;
use Leif\Tests\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

final class LoginActionTest extends WebTestCase
{
    public function testLoginWithValidCredentials()
    {
        $client = static::createClient();
        $db = $client->getContainer()->get(Database::class);

        static::createUser($db, 'tester', 'test_password');

        $client->request('POST', '/api/login', [], [], [], json_encode([
            'username' => 'tester',
            'password' => 'test_password',
        ]));

        $this->assertResponseStatusCodeSame(Response::HTTP_OK);

        $body = json_decode($client->getResponse()->getContent(), true);

        $this->assertArrayHasKey('token', $body);
    }

    public function testLoginWithBadCredentials()
    {
        $client = static::createClient();
        $db = $client->getContainer()->get(Database::class);

        static::createUser($db, 'tester', 'test_password');

        $client->request('POST', '/api/login', [], [], [], json_encode([
            'username' => 'tester',
            'password' => 'wrong_password',
        ]));

        $this->assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }
}
