<?php declare(strict_types=1);

namespace Leif\Tests\Api;

use Leif\Database;
use Leif\Tests\TestCase;
use Leif\Tests\WebTestCase;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Response;

final class LoginActionTest extends TestCase
{
    public function fixtures(): array
    {
        return [
            'organization',
            'user',
        ];
    }

    public function testLoginWithValidCredentials(): void
    {
        $this->client->request('POST', '/login', [
            '_username' => 'tester',
            '_password' => 'test_password',
        ]);

        $this->assertResponseStatusCodeSame(Response::HTTP_FOUND);

        $res = $this->client->getResponse();
        $cookies = $res->headers->getCookies();

        $exists = array_any($cookies, fn($x) => $x->getName() === 'token');

        $this->assertTrue($exists);
    }

    public function testLoginWithBadCredentials(): void
    {
        $this->client->request('POST', '/login', [
            '_username' => 'tester',
            '_password' => 'wrong_password',
        ]);

        $this->assertResponseStatusCodeSame(Response::HTTP_UNAUTHORIZED);
    }

    public function testRehashesWeakPassword(): void
    {
        // the default cost for testing is 4.
        $hash = password_hash('test_password', PASSWORD_BCRYPT, [
            'cost' => 5,
        ]);
        
        $this->db->execute('UPDATE user SET password_hash = ? WHERE user_id = ?', [
            $hash, 1,
        ]);

        $this->client->request('POST', '/login', [
            '_username' => 'tester',
            '_password' => 'test_password',
        ]);

        $this->assertResponseStatusCodeSame(Response::HTTP_FOUND);

        $user = $this->db->selectOne('SELECT * FROM user WHERE user_id = ?', [1]);

        $this->assertNotSame($hash, $user['password_hash']);
    }
}
