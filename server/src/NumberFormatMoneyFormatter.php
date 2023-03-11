<?php declare(strict_types=1);

namespace Leif;

use Money\Currencies;
use Money\Money;
use Money\MoneyFormatter;

final class NumberFormatMoneyFormatter implements MoneyFormatter
{
    static Currencies|null $currencies = null;

    readonly int $decimals;
    readonly string $decimalSeparator;
    readonly string $thousandsSeparator;

    public function __construct(int $decimals, string $decimalSeparator, string $thousandsSeparator)
    {
        $this->decimals = $decimals;
        $this->decimalSeparator = $decimalSeparator;
        $this->thousandsSeparator = $thousandsSeparator;
    }

    /**
     * @inheritDoc
     * @return string
     */
    public function format(Money $money): string
    {
        if (!static::$currencies) {
            static::$currencies = new Currencies\ISOCurrencies();
        }

        $currency = $money->getCurrency();
        $units = static::$currencies->subunitFor($currency);
        $amount = $money->getAmount();
        $negative = $amount[0] === '-';

        if ($negative) {
            $amount = substr($amount, 1);
        }

        // pad the number so we have at least as
        // many digits as one "whole" unit of money.
        // if we padded 1 US cent this would result
        // in a string 001.
        $amount = str_pad($amount, $units + 1, '0', STR_PAD_LEFT);
        $integerPart = substr($amount, 0, -$units);
        $fractionPart = substr($amount, -$units);

        $formatted = number_format((int)$integerPart, 0, '', $this->thousandsSeparator);

        if ($negative) {
            $formatted = '-' . $formatted;
        }

        // append the fraction part if we are configured
        // to do that. the formatting is similar to the
        // integer part but we must remember to pad with
        // zeros correctly.
        if ($this->decimals > 0) {
            // this will remove any extraneous decimal
            // places for the case where the we want less
            // decimals than our money has subunits for.
            $formattedFractions = substr($fractionPart, 0, $this->decimals);

            // this will append more zeros for the reverse
            // case where we want more decimals than our
            // currency can provide.
            $formattedFractions = str_pad($formattedFractions, $this->decimals, '0', STR_PAD_RIGHT);

            $formatted .= $this->decimalSeparator . $formattedFractions;
        }

        return $formatted;
    }
}
