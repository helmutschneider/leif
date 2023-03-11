<?php declare(strict_types=1);

namespace Leif\Invoice;

use Leif\SnakeTrait;
use Money\Money;

final class InvoiceLineItem
{
    use SnakeTrait;

    public readonly string $name;
    public readonly float $quantity;
    public readonly Money $price;
    public readonly Money $total;

    public string $key = '';

    public function __construct(string $name, float $quantity, Money $price, int $precision)
    {
        $this->name = $name;
        $this->quantity = $quantity;
        $this->price = $price;

        $mul = sprintf('%.14f', $quantity);
        $this->total = roundMoney($price->multiply($mul), $precision);
    }
}
