<?php declare(strict_types=1);

namespace Leif\Invoice;

use Leif\SnakeTrait;

final class InvoiceField
{
    use SnakeTrait;

    public readonly string $name;
    public readonly string $value;
    public readonly bool $isEditable;

    public function __construct(string $name, string $value, bool $isEditable)
    {
        $this->name = $name;
        $this->value = $value;
        $this->isEditable = $isEditable;
    }

    public function __toString(): string
    {
        return $this->value;
    }
}
