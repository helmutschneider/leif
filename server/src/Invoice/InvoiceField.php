<?php declare(strict_types=1);

namespace Leif\Invoice;

use Leif\SnakeTrait;

final class InvoiceField
{
    use SnakeTrait;

    public readonly string $name;
    public readonly string $key;
    public readonly string $value;

    public int $sorting = 0;
    public bool $isEditable = true;

    public function __construct(string $name, string $key, string $value)
    {
        $this->name = $name;
        $this->key = $key;
        $this->value = $value;
    }

    public function __toString(): string
    {
        return $this->value;
    }
}
