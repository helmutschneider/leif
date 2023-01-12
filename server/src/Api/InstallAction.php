<?php declare(strict_types=1);

namespace Leif\Api;

use Leif\Database;
use Leif\Tests\DatabaseTrait;
use Leif\View;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\PasswordHasherInterface;

final class InstallAction
{
    const ERR_MISSING_USERNAME = 0;
    const ERR_MISSING_PASSWORD = 1;
    const SAMPLE_TEMPLATES = [
        [
            'name' => 'Faktura mot kund 25% moms',
            'transactions' => [
                [
                    'account' => 1510,
                    'kind' => 'debit',
                    'amount' => 1250_00,
                ],
                [
                    'account' => 2610,
                    'kind' => 'credit',
                    'amount' => 250_00,
                ],
                [
                    'account' => 3001,
                    'kind' => 'credit',
                    'amount' => 1000_00,
                ],
            ],
        ],
        [
            'name' => 'Leverantörsfaktura',
            'transactions' => [
                [
                    'account' => 2440,
                    'kind' => 'credit',
                    'amount' => 3000_00,
                ],
                [
                    'account' => 2640,
                    'kind' => 'debit',
                    'amount' => 600_00,
                ],
                [
                    'account' => 6110,
                    'kind' => 'debit',
                    'amount' => 2400_00,
                ],
            ],
        ],
        [
            'name' => 'Kontorsmaterial inköp bankkort',
            'transactions' => [
                [
                    'account' => 1910,
                    'kind' => 'credit',
                    'amount' => 500_00,
                ],
                [
                    'account' => 2640,
                    'kind' => 'debit',
                    'amount' => 100_00,
                ],
                [
                    'account' => 6110,
                    'kind' => 'debit',
                    'amount' => 400_00,
                ],
            ],
        ],
        [
            'name' => 'Lön 30 000 kr (Skattetabell 30, 2022)',
            'transactions' => [
                [
                    'account' => 1910,
                    'kind' => 'credit',
                    'amount' => 23760_00,
                ],
                [
                    'account' => 2710,
                    'kind' => 'credit',
                    'amount' => 6240_00,
                ],
                [
                    'account' => 2730,
                    'kind' => 'credit',
                    'amount' => 9426_00,
                ],
                [
                    'account' => 7210,
                    'kind' => 'debit',
                    'amount' => 30000_00,
                ],
                [
                    'account' => 7510,
                    'kind' => 'debit',
                    'amount' => 9426_00,
                ],
            ],
        ],
        [
            'name' => 'Sociala avgifter betalning (lön 30 000kr)',
            'transactions' => [
                [
                    'account' => 1910,
                    'kind' => 'credit',
                    'amount' => 15666_00,
                ],
                [
                    'account' => 2710,
                    'kind' => 'debit',
                    'amount' => 6240_00,
                ],
                [
                    'account' => 2730,
                    'kind' => 'debit',
                    'amount' => 9426_00,
                ],
            ],
        ],
    ];

    private Database $db;
    private PasswordHasherInterface $passwordHasher;

    public function __construct(Database $db, PasswordHasherInterface $passwordHasher)
    {
        $this->db = $db;
        $this->passwordHasher = $passwordHasher;
    }

    public function __invoke(Request $request): Response
    {
        if (static::isTableSchemaLoaded($this->db)) {
            return new RedirectResponse('/');
        }

        $errors = [];
        $username = '';
        $password = '';

        if ($request->isMethod('POST')) {
            $body = $request->request->all();
            $username = $body['username'] ?? '';
            $password = $body['password'] ?? '';

            if (!$username) {
                $errors[] = static::ERR_MISSING_USERNAME;
            }
            if (!$password) {
                $errors[] = static::ERR_MISSING_PASSWORD;
            }

            if ($errors === []) {
                $this->db->transaction(function () use ($username, $password) {
                    static::loadSchema($this->db);
                    $this->db->execute('INSERT INTO organization (name) VALUES (?)', [
                        $username,
                    ]);

                    $organizationId = $this->db->getLastInsertId();
                    $this->db->execute('INSERT INTO user (username, password_hash, organization_id) VALUES  (?, ?, ?)', [
                        $username,
                        $this->passwordHasher->hash($password),
                        $organizationId,
                    ]);

                    foreach (static::SAMPLE_TEMPLATES as $voucher) {
                        $this->db->execute('INSERT INTO voucher (name, date, organization_id, is_template) VALUES (?, ?, ?, ?)', [
                            $voucher['name'],
                            date('Y-m-d'),
                            $organizationId,
                            1,
                        ]);

                        $voucherId = $this->db->getLastInsertId();
                        $sum = 0;

                        foreach ($voucher['transactions'] as $transaction) {
                            CreateVoucherAction::insertTransaction($this->db, $transaction, $voucherId);
                            $sum += ($transaction['kind'] === 'debit')
                                ? $transaction['amount']
                                : (-$transaction['amount']);
                        }

                        assert($sum === 0);
                    }
                });
                return new RedirectResponse('/');
            }
        }

        $layout = new View(__DIR__ . '/../../views/layout.php');
        $html = $layout->render([
            'body' => $layout->renderChild(__DIR__ . '/../../views/install.php', [
                'errors' => $errors,
                'username' => $username,
                'password' => $password,
            ]),
        ]);

        return new Response($html, Response::HTTP_OK, [
            'Content-Type' => 'text/html',
        ]);
    }

    public static function loadSchema(Database $db): void
    {
        $schema = file_get_contents(__DIR__ . '/../../../data/sqlite.sql');
        $parts = explode(';', trim($schema));

        foreach ($parts as $part) {
            $part = trim($part);
            if (!$part) {
                continue;
            }
            $db->execute($part);
        }
    }

    public static function isTableSchemaLoaded(Database $db): bool
    {
        $ok = $db->selectOne('SELECT 1 FROM sqlite_master WHERE type = :type AND name = :name', [
            ':type' => 'table',
            ':name' => 'voucher',
        ]);
        return $ok !== null;
    }
}
