<?php declare(strict_types=1);

namespace Leif;

final class Json
{
    public const JSON_FLAGS = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES;

    private function __construct()
    {
    }

    public static function encode($data): string
    {
        return \json_encode($data, static::JSON_FLAGS);
    }

    public static function decode(string $value): mixed
    {
        return \json_decode($value, true);
    }
}
