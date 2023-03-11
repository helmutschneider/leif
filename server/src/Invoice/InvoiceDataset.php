<?php declare(strict_types=1);

namespace Leif\Invoice;

use InvalidArgumentException;
use Leif\SnakeTrait;
use Money\Currencies;
use Money\Currency;
use Money\Money;

final class InvoiceDataset
{
    use SnakeTrait;

    public readonly Currency $currency;
    public readonly float $vatRate;
    public readonly int $precision;

    /**
     * @var InvoiceField[]
     */
    public readonly array $fields;

    /**
     * @var InvoiceLineItem[]
     */
    public readonly array $lineItems;

    public readonly Money $total;
    public readonly Money $vat;
    public readonly Money $totalWithVat;

    /**
     * @param Currency $currency
     * @param float $vatRate
     * @param int $precision
     * @param InvoiceField[] $fields
     * @param InvoiceLineItem[] $lineItems
     */
    public function __construct(Currency $currency, float $vatRate, int $precision, array $fields, array $lineItems)
    {
        $this->currency = $currency;
        $this->vatRate = $vatRate;
        $this->precision = $precision;
        $this->fields = $fields;
        $this->lineItems = $lineItems;

        $total = new Money(0, $currency);

        foreach ($lineItems as $item) {
            $total = $total->add($item->total);
        }

        $total = roundMoney($total, $precision);
        $vatMul = sprintf('%.14f', $vatRate / 100.0);
        $vat = roundMoney($total->multiply($vatMul), $precision);

        $this->total = $total;
        $this->vat = $vat;
        $this->totalWithVat = $total->add($vat);
    }

    public static function fromArray(array $data): static
    {
        $fields = [];

        foreach ($data['fields'] as $field) {
            $key = $field['key'];
            $f = new InvoiceField($field['name'], $key, $field['value']);
            $f->sorting = $field['sorting'] ?? pow(2, 16);
            $f->isEditable = $field['is_editable'];
            $fields[$key] = $f;
        }

        uasort($fields, function ($a, $b) {
            return $a->sorting <=> $b->sorting;
        });

        $currency = new Currency($data['currency_code']);
        $precision = $data['precision'];
        $items = [];

        foreach ($data['line_items'] as $item) {
            $price = new Money($item['price'], $currency);
            $it = new InvoiceLineItem($item['name'], (float)$item['quantity'], $price, $precision);
            $it->key = $item['key'];
            $items[] = $it;
        }

        return new static(
            $currency,
            $data['vat_rate'],
            $precision,
            $fields,
            $items
        );
    }
}
