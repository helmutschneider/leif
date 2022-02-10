<?php declare(strict_types = 1);

if (count($argv) < 2) {
    echo 'Usage: php parse_accounts.php [path_to_csv]' . PHP_EOL;
    exit(1);
}

$handle = fopen($argv[1], 'rb');
$out = [];

while ($parts = fgetcsv($handle)) {
    $account = $parts[5] ?? null;

    if (!$account) {
        continue;
    }
    $out[$account] = $parts[6] ?: $parts[3];
}

fclose($handle);

echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES |  JSON_UNESCAPED_UNICODE) . PHP_EOL;
