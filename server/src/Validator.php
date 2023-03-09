<?php declare(strict_types=1);

namespace Leif;

use DateTimeImmutable;
use InvalidArgumentException;

final class Validator
{
    const ERR_REQUIRED = 'The property \'%s\' is required.';
    const ERR_INTEGER = 'The property \'%s\' must be an integer.';
    const ERR_STRING = 'The property \'%s\' must be a string.';
    const ERR_DATE_FORMAT = 'The property \'%s\' must be a date of format \'%s\'.';
    const ERR_BOOLEAN = 'The property \'%s\' must be a boolean.';
    const ERR_ARRAY = 'The property \'%s\' must be an array.';
    const ERR_MINIMUM_STRING = 'The property \'%s\' must have at least %d characters.';
    const ERR_NUMERIC = 'The property \'%s\' must be numeric.';

    readonly array $rules;

    public function __construct(array $rules)
    {
        $this->rules = $rules;
    }

    /**
     * @param array|object $data
     * @return ValidationResult
     */
    public function validate($data): ValidationResult
    {
        $data = static::flatten((array) $data);
        $result = new ValidationResult();
        $shouldSkipValidatingProperties = [];

        foreach ($this->rules as $ruleKey => $rulesAsString) {
            if (mb_substr($ruleKey, -1, 1, 'utf-8') === '*') {
                throw new InvalidArgumentException(
                    'The rule key must not end with \'*\'.'
                );
            }

            $ruleNames = explode('|', $rulesAsString);

            // make sure we prioritize the null rule. it takes
            // precedence over the other rules and cancels them
            // out if the value is null.
            usort($ruleNames, function (string $a, string $b) {
                if (strpos($a, 'null') === 0) {
                    return -1;
                }
                if (strpos($b, 'null') === 0) {
                    return 1;
                }
                return $a <=> $b;
            });

            $values = static::findValuesByRuleKey($data, $ruleKey);
            $isWildcardKey = strpos($ruleKey, '*') !== false;

            foreach ($ruleNames as $unparsedRuleName) {
                $parsedRuleName = preg_split('#(?<!\\\\):#', $unparsedRuleName);
                $name = $parsedRuleName[0];
                $args = array_slice($parsedRuleName, 1);

                // replace any escaped colons...
                for ($i = 0; $i < count($args); ++$i) {
                    $args[$i] = strtr($args[$i], [
                        '\\:' => ':',
                    ]);
                }

                switch ($name) {
                    case 'required':
                        if ($isWildcardKey) {
                            $parentKey = static::findParentKeyOfRuleKey($ruleKey);
                            $parents = static::findValuesByRuleKey($data, $parentKey);

                            if (count($parents) !== count($values)) {
                                $result->addErrorForKey($ruleKey, sprintf(static::ERR_REQUIRED, $ruleKey));
                            }
                        } else {
                            if (!$values) {
                                $result->addErrorForKey($ruleKey, sprintf(static::ERR_REQUIRED, $ruleKey));
                            }
                        }
                        break;
                    case 'int':
                    case 'integer':
                        foreach ($values as $valueKey => $value) {
                            if (isset($shouldSkipValidatingProperties[$valueKey])) {
                                continue;
                            }

                            if (!preg_match('#^-?\d+$#', (string) $value)) {
                                $result->addErrorForKey(
                                    $valueKey, sprintf(static::ERR_INTEGER, $valueKey)
                                );
                            }
                        }
                        break;
                    case 'float':
                    case 'double':
                    case 'number':
                    case 'numeric':
                        foreach ($values as $valueKey => $value) {
                            if (isset($shouldSkipValidatingProperties[$valueKey])) {
                                continue;
                            }
                            if (!is_numeric($value)) {
                                $result->addErrorForKey($valueKey, sprintf(static::ERR_NUMERIC, $valueKey));
                            }
                        }
                        break;
                    case 'str':
                    case 'string':
                        foreach ($values as $valueKey => $value) {
                            if (isset($shouldSkipValidatingProperties[$valueKey])) {
                                continue;
                            }

                            if (!is_string($value)) {
                                $result->addErrorForKey(
                                    $valueKey, sprintf(static::ERR_STRING, $valueKey)
                                );
                            }
                        }
                        break;
                    case 'date_format':
                        $format = $args[0] ?? '';

                        if (!$format) {
                            throw new InvalidArgumentException(
                                'The date_format rule must have a single argument specifying the date format string.'
                            );
                        }

                        foreach ($values as $valueKey => $value) {
                            if (isset($shouldSkipValidatingProperties[$valueKey])) {
                                continue;
                            }

                            $dt = DateTimeImmutable::createFromFormat($format, $value);
                            if ($dt === false) {
                                $result->addErrorForKey(
                                    $valueKey, sprintf(static::ERR_DATE_FORMAT, $valueKey, $format)
                                );
                            }
                        }
                        break;
                    case 'bool':
                    case 'boolean':
                        foreach ($values as $valueKey => $value) {
                            if (isset($shouldSkipValidatingProperties[$valueKey])) {
                                continue;
                            }

                            if (!in_array($value, [false, true, 0, 1, '0', '1'], true)) {
                                $result->addErrorForKey(
                                    $valueKey, sprintf(static::ERR_BOOLEAN, $valueKey)
                                );
                            }
                        }
                        break;
                    case 'array':
                        foreach ($values as $valueKey => $value) {
                            if (isset($shouldSkipValidatingProperties[$valueKey])) {
                                continue;
                            }

                            if (!is_array($value)) {
                                $result->addErrorForKey(
                                    $valueKey, sprintf(static::ERR_ARRAY, $valueKey)
                                );
                            }
                        }
                        break;
                    case 'null':
                    case 'nullable':
                        foreach ($values as $valueKey => $value) {
                            if ($value === null) {
                                $shouldSkipValidatingProperties[$valueKey] = true;
                            }
                        }
                        break;
                    case 'min':
                    case 'minimum':
                        $min = $args[0] ?? null;

                        if ($min === null) {
                            throw new InvalidArgumentException(
                                'The "min" rule requires a single argument specifying the minimum amount of characters.'
                            );
                        }

                        $min = (int) $min;
                        foreach ($values as $valueKey => $value) {
                            if (isset($shouldSkipValidatingProperties[$valueKey])) {
                                continue;
                            }

                            if (is_string($value) && mb_strlen($value, 'utf-8') < $min) {
                                $result->addErrorForKey($valueKey, sprintf(static::ERR_MINIMUM_STRING, $valueKey, $min));
                            }
                        }
                        break;
                    default:
                        throw new InvalidArgumentException(
                            sprintf('Unknown rule \'%s\'.', $name)
                        );
                }
            }
        }

        return $result;
    }

    private static function findValuesByRuleKey(array $flattened, string $ruleKey): array
    {
        $pattern = '#^' . strtr($ruleKey, ['.' => '\\.', '*' => '[^\\.]+']) . '$#';
        $out = [];

        foreach ($flattened as $key => $value) {
            if (preg_match($pattern, $key)) {
                $out[$key] = $value;
            }
        }

        return $out;
    }

    private static function findParentKeyOfRuleKey(string $ruleKey): string
    {
        return preg_replace('#\\.[^\\.]+$#', '', $ruleKey);
    }

    public static function flatten(array $data): array
    {
        $stack = [[[], $data]];
        $out = [];

        while ($item = array_shift($stack)) {
            [$prefixKeys, $chunk] = $item;

            foreach ((array) $chunk as $key => $value) {
                $nextPrefixKeys = array_merge($prefixKeys, [$key]);
                $flattenedKey = implode('.', $nextPrefixKeys);

                if (is_array($value) || is_object($value)) {
                    $stack[] = [$nextPrefixKeys, $value];
                }
                $out[$flattenedKey] = $value;
            }
        }

        ksort($out);

        return $out;
    }
}
