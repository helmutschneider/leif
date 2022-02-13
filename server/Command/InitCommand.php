<?php declare(strict_types=1);

namespace Leif\Command;

use DateTimeImmutable;
use Exception;
use InvalidArgumentException;
use Leif\Database;
use Leif\Security\HmacHasher;
use Leif\Security\SecretKey;
use PDO;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Helper\QuestionHelper;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Question\Question;
use Symfony\Component\PasswordHasher\PasswordHasherInterface;

final class InitCommand extends Command
{
    private Database $db;
    private PasswordHasherInterface $passwordHasher;
    private HmacHasher $tokenHasher;

    public function __construct(Database $db, PasswordHasherInterface $passwordHasher, HmacHasher $tokenHasher)
    {
        parent::__construct('init');

        $this->db = $db;
        $this->passwordHasher = $passwordHasher;
        $this->tokenHasher = $tokenHasher;
    }

    protected function configure()
    {
        parent::configure();

        $this->setDescription('Initialize the database and create a user.');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $helper = $this->getHelper('question');
        assert($helper instanceof QuestionHelper);

        $username = $helper->ask($input, $output, new Question('Username: '));
        $password = $helper->ask($input, $output, new Question('Password: '));
        $workbookName = $helper->ask($input, $output, new Question('Workbook name: '));
        $token = bin2hex(random_bytes(32));

        if (!$username || !$password) {
            throw new InvalidArgumentException(
                'Username and password are required.'
            );
        }

        $schema = file_get_contents(__DIR__ . '/../../data/sqlite.sql');
        $parts = explode(';', trim($schema));

        $this->db->transaction(function () use ($parts, $output, $username, $password, $token, $workbookName) {
            foreach ($parts as $part) {
                if (!$part) {
                    continue;
                }

                $this->db->execute($part);
            }
            $output->writeln('Creating database schema... OK');

            $now = new DateTimeImmutable('now');
            $this->db->execute(
                <<<SQL
INSERT INTO user (username, password_hash, token_hash, created_at, seen_at)
         VALUES  (?, ?, ?, ?, ?)
SQL
            ,
            [
                $username,
                $this->passwordHasher->hash($password),
                $this->tokenHasher->hash($token),
                $now->format('Y-m-d H:i:s'),
                $now->format('Y-m-d H:i:s'),
            ]);
            $output->writeln('Creating user... OK');
            $this->db->execute('INSERT INTO workbook (name, year, user_id) VALUES (?, ?, ?)', [
                $workbookName,
                date('Y'),
                $this->db->getLastInsertId(),
            ]);
            $output->writeln('Creating workbook... OK');
            $output->writeln('API Token: ' . $token);
        });

        return 0;
    }
}
