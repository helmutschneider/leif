<?php declare(strict_types=1);

namespace Leif\Tests;

use Leif\Api\InstallAction;
use Leif\Database;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

abstract class TestCase extends KernelTestCase
{
    use DatabaseTrait;

    protected ?Database $db = null;

    public function setUp(): void
    {
        parent::setUp();

        static::bootKernel([
            'debug' => false,
        ]);

        $this->db = static::getContainer()->get(Database::class);
        InstallAction::loadSchema($this->db);
    }
}
