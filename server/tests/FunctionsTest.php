<?php declare(strict_types=1);

namespace Leif\Tests;

final class FunctionsTest extends TestCase
{
    public function roundProvider()
    {
        return [
            [150, 0, 200],
            [150, 2, 150],
            [155, 1, 160],
        ];
    }

    /**
     * @dataProvider roundProvider
     */
    public function testRoundMoney(int $value, int $precision, int $expected): void
    {
        $currency = new \Money\Currency('USD');
        $amount = new \Money\Money($value, $currency);
        $rounded = roundMoney($amount, $precision);

        $this->assertSame((string)$expected, $rounded->getAmount());
    }

    public function testSnake()
    {
        $this->assertSame('i_am_a_snake', snake('IAmASnake'));
        $this->assertSame('i_am_a_snake', snake('i_am_a_snake'));
        $this->assertSame('i_am_a_snake', snake('iAmASnake'));
    }
}
