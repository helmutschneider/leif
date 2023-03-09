<?php declare(strict_types=1);

namespace Leif\Tests;

use Leif\Api\InstallAction;
use Leif\Database;
use Leif\Security\HmacHasher;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use \Symfony\Bundle\FrameworkBundle\Test\WebTestCase as SymfonyWebTestCase;

abstract class WebTestCase extends SymfonyWebTestCase
{
    use DatabaseTrait;

    protected static function createClient(array $options = [], array $server = []): KernelBrowser
    {
        $client = parent::createClient($options, $server);
        $db = $client->getContainer()->get(Database::class);
        assert($db instanceof Database);
        InstallAction::loadSchema($db);

        return $client;
    }

    protected static function createUserWithToken(KernelBrowser $client, string $username, string $token): int
    {
        $db = $client->getContainer()->get(Database::class);
        $hasher = $client->getContainer()->get(HmacHasher::class);

        assert($db instanceof Database);
        assert($hasher instanceof HmacHasher);

        $userId = static::createUser($db, $username);
        static::createToken($db, $hasher->hash(hex2bin($token)), $userId);

        return $userId;
    }
}
