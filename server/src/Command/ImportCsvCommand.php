<?php declare(strict_types=1);

namespace Leif\Command;

use DateTimeImmutable;
use InvalidArgumentException;
use Leif\Api\CreateVoucherAction;
use LogicException;
use Leif\Database;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Helper\QuestionHelper;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Question\Question;

final class ImportCsvCommand extends Command
{
    private Database $db;

    public function __construct(Database $db)
    {
        $this->db = $db;

        parent::__construct('import_csv');
    }

    protected function configure()
    {
        parent::configure();

        $this->addArgument('csv_path', InputArgument::REQUIRED, 'Path to the csv file.');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $helper = $this->getHelper('question');
        assert($helper instanceof QuestionHelper);

        $workbookName = $helper->ask($input, $output, new Question('Workbook name: '));
        $userId = $helper->ask($input, $output, new Question('User ID: '));

        $path = $input->getArgument('csv_path');
        $handle = fopen($path, 'rb');

        $this->db->transaction(function () use ($handle, $workbookName, $userId, $output) {
            $workbookId = null;
            $buffer = [];
            $sum = 0;

            while ($row = fgetcsv($handle)) {
                $dt = DateTimeImmutable::createFromFormat('Y-m-d', $row[0]);

                if (!$dt) {
                    continue;
                }

                if ($buffer && $row[0] !== $buffer[0]['date']) {
                    // this is super bad, we changed dates but the buffer wasn't empty.
                    var_dump($buffer);

                    throw new LogicException('New date with non-empty buffer. Bad!');
                }

                // we need to parse the first transaction before we can create
                // the workbook.
                if ($workbookId === null) {
                    $this->db->execute('INSERT INTO workbook (name, year, user_id) VALUES (?, ?, ?)', [
                        $workbookName,
                        $dt->format('Y'),
                        $userId,
                    ]);
                    $workbookId = $this->db->getLastInsertId();
                }

                $debit = $this->parseAmount($row[3]);
                $credit = $this->parseAmount($row[4]);

                $buffer[] = [
                    'date' => $row[0],
                    'name' => $row[1],
                    'account' => $row[2],
                    'debit' => $debit,
                    'credit' => $credit,
                ];
                $sum += $debit;
                $sum -= $credit;

                // commit the buffer when the sum is zero, which means that
                // we have found a complete and valid voucher.
                if ($sum === 0) {
                    $name = $buffer[0]['name'];
                    $date = $buffer[0]['date'];

                    $output->writeln("OK: $date $name");

                    $this->db->execute('INSERT INTO voucher (created_at, date, name, workbook_id) VALUES (?, ?, ?, ?)', [
                        (new DateTimeImmutable('now'))->format('Y-m-d H:i:s'),
                        $buffer[0]['date'],
                        $buffer[0]['name'],
                        $workbookId,
                    ]);
                    $voucherId = $this->db->getLastInsertId();

                    foreach ($buffer as $item) {
                        $this->db->execute('INSERT into "transaction" (account, amount, kind, voucher_id) VALUES (?, ?, ?, ?)', [
                            $item['account'],
                            $item['debit'] ?: $item['credit'],
                            $item['debit'] > 0
                                ? CreateVoucherAction::VOUCHER_KIND_DEBIT
                                : CreateVoucherAction::VOUCHER_KIND_CREDIT,
                            $voucherId,
                        ]);
                    }

                    $buffer = [];
                }
            }
        });

        return 0;
    }

    protected function parseAmount(string $amount): int
    {
        if (!$amount) {
            return 0;
        }

        $amount = preg_replace('/([^\d,])/', '', $amount);

        if (!preg_match('/^(\d+),(\d{2})$/', $amount, $matches)) {
            throw new InvalidArgumentException(
                sprintf('Value \'%s\' is not a valid monetary amount.', $amount)
            );
        }

        return (int) ($matches[1] . $matches[2]);
    }
}
