<?php declare(strict_types = 1);

namespace Leif\Tests;

use Leif\NumberFormatMoneyFormatter;
use Money\Currencies\ISOCurrencies;
use Money\Currency;
use Money\Money;

final class NumberFormatMoneyFormatterTest extends TestCase
{
    public static function formatProvider(): array
    {
        return [
            [100, 'USD', 2, '1.00'],
            [100, 'USD', 3, '1.000'],
            [101, 'USD', 3, '1.010'],
            [1001, 'USD', 0, '10'],
            [1, 'USD', 2, '0.01'],
            [1, 'USD', 3, '0.010'],
            [-1, 'USD', 3, '-0.010'],
            [115, 'USD', 1, '1.1'],
            [123456, 'USD', 2, '1,234.56'],
            [-123456, 'USD', 2, '-1,234.56'],
            [123456, 'USD', 4, '1,234.5600'],
            [-123456, 'USD', 4, '-1,234.5600'],
        ];
    }

    /**
     * @dataProvider formatProvider
     */
    public function testFormatsCorrectly(int $amount, string $currency, int $decimals, string $expected): void
    {
        $fmt = new NumberFormatMoneyFormatter($decimals, '.', ',');
        $value = new Money($amount, new Currency($currency));
        $this->assertEquals($expected, $fmt->format($value));
    }
}
