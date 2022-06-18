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

    public function testRehashesWeakPassword()
    {
        $client = static::createClient();
        $db = $client->getContainer()->get(Database::class);
        assert($db instanceof Database);

        $userId = static::createUser($db, 'tester', 'test_password');

        // the default cost for testing is 4.
        $hash = password_hash('test_password', PASSWORD_BCRYPT, [
            'cost' => 5,
        ]);
        $db->execute('UPDATE user SET password_hash = ? WHERE user_id = ?', [
            $hash,
            $userId,
        ]);

        $client->request('POST', '/api/login', [], [], [], json_encode([
            'username' => 'tester',
            'password' => 'test_password',
        ]));

        $this->assertResponseStatusCodeSame(Response::HTTP_OK);

        $user = $db->selectOne('SELECT * FROM user WHERE user_id = ?', [$userId]);

        $this->assertNotSame($hash, $user['password_hash']);
    }
}
