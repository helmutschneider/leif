<?php declare(strict_types=1);

namespace Leif\Tests\Api;

use Leif\Tests\TestCase;
use Symfony\Component\BrowserKit\Cookie;
use Symfony\Component\HttpFoundation\Response;

class LogoutActionTest extends TestCase
{
    public function fixtures(): array
    {
        return [
            'organization',
            'user',
            'token',
        ];
    }

    public function testLogoutRemovesTokensFromDatabase(): void
    {
        $this->client->getCookieJar()
            ->set(new Cookie('token', '1234'));
        $this->client->request('GET', '/logout');
        $this->assertResponseStatusCodeSame(Response::HTTP_FOUND);

        $r = $this->db->selectOne('select count(1) as num from token');
        $this->assertSame(0, $r['num']);
    }
}
