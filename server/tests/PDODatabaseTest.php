<?php declare(strict_types=1);

namespace Leif\Tests;

use Exception;
use PDO;
use Leif\Database;
use Leif\PDODatabase;

final class PDODatabaseTest extends TestCase
{
    private Database|null $otherDb = null;

    public function setUp(): void
    {
        parent::setUp();

        $this->otherDb = new PDODatabase(new PDO('sqlite::memory:'));
        $this->otherDb->execute(<<<SQL
CREATE TABLE car (
    car_id INTEGER PRIMARY KEY NOT NULL,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    weight REAL NOT NULL DEFAULT 0.0
);
SQL
);
    }

    public function testSelectOneAndCastsValues()
    {
        $this->otherDb->execute('INSERT INTO car (make, model, weight) VALUES (?, ?, ?)', ['Volvo', 'V70', 3.5]);

        $row = $this->otherDb->selectOne('SELECT * FROM car');

        $this->assertSame(1, $row['car_id']);
        $this->assertSame('Volvo', $row['make']);
        $this->assertSame('V70', $row['model']);
        $this->assertSame(3.5, $row['weight']);
    }

    public function testSelectAll()
    {
        $this->otherDb->execute('INSERT INTO car (make, model) VALUES (?, ?)', ['Volvo', 'V70']);
        $this->otherDb->execute('INSERT INTO car (make, model) VALUES (?, ?)', ['Toyota', 'Prius']);

        $rows = $this->otherDb->selectAll('SELECT * FROM car');

        $this->assertCount(2, $rows);

        $this->assertSame(1, $rows[0]['car_id']);
        $this->assertSame('Volvo', $rows[0]['make']);
        $this->assertSame('V70', $rows[0]['model']);
        $this->assertSame(2, $rows[1]['car_id']);
        $this->assertSame('Toyota', $rows[1]['make']);
        $this->assertSame('Prius', $rows[1]['model']);
    }

    public function testGetLastInsertId()
    {
        $this->otherDb->execute('INSERT INTO car (make, model) VALUES (?, ?)', ['Volvo', 'V70']);
        $this->assertSame(1, $this->otherDb->getLastInsertId());

        $this->otherDb->execute('INSERT INTO car (make, model) VALUES (?, ?)', ['Toyota', 'Prius']);
        $this->assertSame(2, $this->otherDb->getLastInsertId());
    }

    public function testTransactionCommits()
    {
        $this->otherDb->transaction(function () {
            $this->otherDb->execute('INSERT INTO car (make, model) VALUES (?, ?)', ['Tesla', 'Model S']);
        });

        $rows = $this->otherDb->selectAll('SELECT * FROM car');

        $this->assertCount(1, $rows);
        $this->assertSame('Tesla', $rows[0]['make']);
        $this->assertSame('Model S', $rows[0]['model']);
    }

    public function testTransactionRollsBackOnExceptions()
    {
        try {
            $this->otherDb->transaction(function () {
                $this->otherDb->execute('INSERT INTO car (make, model) VALUES (?, ?)', ['Volvo', 'V70']);
                throw new Exception('Bad!');
            });
        } catch (Exception $e) {
        }

        $rows = $this->otherDb->selectAll('SELECT * FROM car');

        $this->assertEmpty($rows);
    }
}
