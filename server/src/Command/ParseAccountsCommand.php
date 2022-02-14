<?php declare(strict_types=1);

namespace Leif\Command;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

final class ParseAccountsCommand extends Command
{
    const ARGUMENT_CSV_PATH = 'csv_path';

    public function __construct(string $name = null)
    {
        parent::__construct('parse_accounts');
    }

    protected function configure()
    {
        parent::configure();

        $this
            ->setDescription('Convert a CSV-dump of the BAS account plan into JSON.')
            ->addArgument(static::ARGUMENT_CSV_PATH, InputArgument::REQUIRED);
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $path = $input->getArgument(static::ARGUMENT_CSV_PATH);
        $handle = fopen($path, 'rb');
        $out = [];

        while ($parts = fgetcsv($handle)) {
            $account = $parts[5] ?? null;
            if (!$account) {
                continue;
            }
            $out[$account] = $parts[6] ?: $parts[3];
        }

        fclose($handle);

        $json = json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES |  JSON_UNESCAPED_UNICODE);
        $output->writeln($json, OutputInterface::OUTPUT_RAW);

        return 0;
    }
}
