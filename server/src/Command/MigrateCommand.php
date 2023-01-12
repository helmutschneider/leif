<?php declare(strict_types=1);

namespace Leif\Command;

use Leif\Database;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

final class MigrateCommand extends Command
{
    readonly Database $db;
    readonly string $migrationsPath;
    readonly string $migrationsNamespace;

    public function __construct(Database $db, string $migrationsPath, string $migrationsNamespace)
    {
        $this->db = $db;
        $this->migrationsPath = $migrationsPath;
        $this->migrationsNamespace = $migrationsNamespace;

        parent::__construct('migrate');
    }

    public function execute(InputInterface $input, OutputInterface $output): int
    {
        $clazzes = $this->resolveMigrationClasses();
        $applied = $this->resolveAppliedMigrations();
        $didApplyMigrations = false;

        foreach ($clazzes as $clazz) {
            $migration = new $clazz();
            assert($migration instanceof Database\Migration);

            $name = get_class($migration);

            if (in_array($name, $applied, true)) {
                continue;
            }

            $didApplyMigrations = true;
            $output->write("Applying: {$name}... ");

            try {
                $migration->apply($this->db);
                $this->db->execute('INSERT INTO "migration" ("name") VALUES (:name)', [
                    ':name' => $name,
                ]);
            } catch (\Exception $e) {
                $output->writeln($e);
                return 1;
            }

            $output->writeln("OK");
        }

        if (!$didApplyMigrations) {
            $output->writeln("No migrations to apply.");
        }

        return 0;
    }

    private function resolveMigrationClasses(): array
    {
        $pattern = rtrim($this->migrationsPath, '\\/') . '/*';
        $stuff = glob($pattern);
        $result = [];

        foreach ($stuff as $item) {
            if (!is_file($item)) {
                continue;
            }
            if (!preg_match('/([^\\/]+)\.[^\.]+$/', $item, $matches)) {
                continue;
            }
            $clazzName = $matches[1];
            $fullyQualifiedName = $this->migrationsNamespace . $clazzName;

            if (!class_exists($fullyQualifiedName)) {
                continue;
            }

            if (!is_a($fullyQualifiedName, Database\Migration::class, true)) {
                continue;
            }

            $result[] = $fullyQualifiedName;
        }

        return $result;
    }

    private function resolveAppliedMigrations(): array
    {
        $migrationTableExists = $this->db->selectOne('SELECT 1 FROM sqlite_master WHERE type = :type AND name = :name', [
            ':type' => 'table',
            ':name' => 'migration',
        ]);

        if (!$migrationTableExists) {
            return [];
        }

        $rows = $this->db->selectAll('SELECT * FROM migration');

        return array_map(fn (array $row) => $row['name'], $rows);
    }
}
