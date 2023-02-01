<?php declare(strict_types=1);

namespace Leif\Command;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

final class CreateMigrationCommand extends Command
{
    const ARGUMENT_NAME = 'name';
    const MIGRATION_TEMPLATE = <<<TXT
<?php declare(strict_types = 1);

namespace Leif\Database;

use Exception;
use Leif\Database;

final class %s implements Migration
{
    public function apply(Database \$db): void
    {
        throw new Exception('Not implemented!');
    }
}

TXT;

    readonly string $migrationsPath;

    public function __construct(string $migrationsPath)
    {
        $this->migrationsPath = $migrationsPath;

        parent::__construct('migrate:create');

        $this->addArgument(static::ARGUMENT_NAME, InputArgument::REQUIRED, 'Name of the migration.');
    }

    public function execute(InputInterface $input, OutputInterface $output): int
    {
        $name = sprintf('Migration_%s_%s', date('Ymd_Hi'), $input->getArgument('name'));
        $filename = "{$this->migrationsPath}/{$name}.php";
        $data = sprintf(static::MIGRATION_TEMPLATE, $name);

        file_put_contents($filename, $data);

        $output->writeln("Created migration '{$filename}'.");

        return 0;
    }
}
