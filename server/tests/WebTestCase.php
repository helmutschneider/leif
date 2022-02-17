<?php declare(strict_types=1);

namespace Leif\Tests;

use Leif\Api\InstallAction;
use Leif\Database;
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
}
