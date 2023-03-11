<?php declare(strict_types=1);

namespace Leif\Tests\Invoice;

use Leif\Invoice\InvoiceDataset;
use Leif\Tests\TestCase;

final class InvoiceDatasetTest extends TestCase
{
    public function testCalculatesTotalCorrectlyWithZeroPrecision()
    {
        $ds = InvoiceDataset::fromArray([
            'currency_code' => 'SEK',
            'precision' => 0,
            'vat_rate' => 25.0,
            'fields' => [],
            'line_items' => [
                [
                    'name' => '',
                    'quantity' => 5,
                    'price' => 90015,
                ],
                [
                    'name' => '',
                    'quantity' => 1,
                    'price' => 10000,
                ],
            ],
        ]);

        $this->assertSame('450100', $ds->lineItems[0]->total->getAmount());
        $this->assertSame('460100', $ds->total->getAmount());
        $this->assertSame('115000', $ds->vat->getAmount());
        $this->assertSame('575100', $ds->totalWithVat->getAmount());
    }

    public function testCalculatesTotalCorrectlyWithNonZeroPrecision()
    {
        $ds = InvoiceDataset::fromArray([
            'currency_code' => 'SEK',
            'precision' => 2,
            'vat_rate' => 25.0,
            'fields' => [],
            'line_items' => [
                [
                    'name' => '',
                    'quantity' => 5,
                    'price' => 90015,
                ],
                [
                    'name' => '',
                    'quantity' => 1,
                    'price' => 10000,
                ],
            ],
        ]);

        $this->assertSame('450075', $ds->lineItems[0]->total->getAmount());
        $this->assertSame('460075', $ds->total->getAmount());
        $this->assertSame('115019', $ds->vat->getAmount());
        $this->assertSame('575094', $ds->totalWithVat->getAmount());
    }
}