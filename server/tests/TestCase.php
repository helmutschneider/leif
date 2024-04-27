<?php declare(strict_types=1);

namespace Leif\Tests;

use Leif\Api\InstallAction;
use Leif\Database;
use Leif\Security\HmacHasher;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

abstract class TestCase extends WebTestCase
{
    use DatabaseTrait;

    const DATABASE_FIXTURES = [
        'organization' => [
            [
                'organization_id' => 1,
                'name' => 'Organization name',
            ],
        ],
        'user' => [
            [
                'user_id' => 1,
                'username' => 'tester',
                'password_hash' => '$2y$13$UhljJ7JEcXRZBVRbY9xuxuAskVQhfDmgyI11ShDB.3gUFibbYXQmy',
                'role' => 'ROLE_ADMIN',
                'organization_id' => 1,
            ],
        ],
        'token' => [
            [
                'token_id' => 1,
                'value' => '1234',
                'seen_at' => '2040-01-01 00:00:00',
                'user_id' => 1,
            ],
        ],
        'voucher' => [
            [
                'voucher_id' => 1,
                'date' => '2023-03-12',
                'name' => 'Yee',
                'organization_id' => 1,
            ],
        ],
        'invoice_template' => [
            [
                'invoice_template_id' => 1,
                'name' => 'Yee',
                'body' => 'Boi',
                'organization_id' => 1,
            ],
        ],
    ];

    protected Database|null $db = null;
    protected KernelBrowser|null $client = null;

    public function fixtures(): array
    {
        return [];
    }

    public function setUp(): void
    {
        parent::setUp();

        $this->client = static::createClient([
            'environment' => 'test',
            'debug' => true,
        ]);

        $container = static::getContainer();
        $container->set(HmacHasher::class, new class implements HmacHasher {
            public function hash(string $value): string
            {
                return $value;
            }
            public function verify(string $hash, string $value): bool
            {
                return $hash === $value;
            }
        });

        $this->db = $container->get(Database::class);

        InstallAction::loadSchema($this->db);

        $this->loadFixtures();
    }

    protected function loadFixtures(): void
    {
        $fixtures = $this->fixtures();

        foreach ($fixtures as $name) {
            $data = static::DATABASE_FIXTURES[$name] ?? [];

            if (!$data) {
                continue;
            }

            $keys = array_keys($data[0]);
            $columns = implode(', ', $keys);
            $placeholders = implode(', ', array_fill(0, count($keys), '?'));
            $pdo = $this->db->getPDO();
            $stmt = $pdo->prepare(
                "INSERT INTO {$name} ({$columns}) VALUES ({$placeholders})"
            );
            foreach ($data as $row) {
                $k = 1;
                foreach ($row as $value) {
                    $stmt->bindValue($k, $value);
                    $k += 1;
                }
                $stmt->execute();
            }
        }
    }

    public function tearDown(): void
    {
        $this->db = null;
        $this->client = null;

        parent::tearDown();
    }
}
