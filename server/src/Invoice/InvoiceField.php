<?php declare(strict_types=1);

namespace Leif\Invoice;

use Leif\SnakeTrait;

final class InvoiceField
{
    use SnakeTrait;

    public readonly string $name;
    public readonly string $value;

    public bool $isEditable = true;

    public function __construct(string $name, string $value)
    {
        $this->name = $name;
        $this->value = $value;
    }

    public function __toString(): string
    {
        return $this->value;
    }
}
