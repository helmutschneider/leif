<?php declare(strict_types=1);

function snake(string $value): string {
    return strtolower(preg_replace('/(.)(?=[A-Z])/', '$1_', $value));
}

function render(string $template, array $data = []): string {
    static $twig = null;

    if ($twig === null) {
        $loader = new \Twig\Loader\ArrayLoader();
        $twig = new \Twig\Environment($loader, [
            'cache' => false,
            'strict_variables' => true,
        ]);

        // FIXME: we can't use the first-class callable syntax here due
        //   to a bug in OPCache. it seems to have been fixed in later
        //   versions of 8.1, but not in 8.1.2 which ubuntu mainline is
        //   using.
        //
        //   https://github.com/php/php-src/issues/8140
        $anchors = new \Twig\TwigFilter('anchors', '\\anchors');
        $twig->addFilter($anchors);

        $money = new \Twig\TwigFilter('money', function (\Money\Money $money, int $decimals = 0) {
            $code = $money->getCurrency()->getCode();
            $formatter = match ($code) {
                'SEK' => new \Leif\NumberFormatMoneyFormatter($decimals, ',', ' '),
                'USD' => new \Leif\NumberFormatMoneyFormatter($decimals, '.', ','),
                default => throw new RuntimeException('bad'),
            };
            return $formatter->format($money);
        });
        $twig->addFilter($money);
    }

    return $twig->createTemplate($template)->render($data);
}

function anchors(string $template): string {
    // markdown links: [name](url)
    $template = preg_replace('#\[([^\[\]]+)\]\(([^\(\)]+)\)#', '<a href="$2" target="_blank">$1</a>', $template);

    // email addresses
    $template = preg_replace('#\S+@\S+#', '<a href="mailto:$0">$0</a>', $template);

    $template = nl2br($template);

    return $template;
}

function roundMoney(\Money\Money $money, int $precision = 0): \Money\Money {
    static $currencies;

    if (!$currencies) {
        $currencies = new \Money\Currencies\ISOCurrencies();
    }

    $currency = $money->getCurrency();
    $subunit = $currencies->subunitFor($currency);

    return $money->roundToUnit($subunit - $precision);
}
