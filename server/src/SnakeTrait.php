<?php declare(strict_types=1);

namespace Leif;

use InvalidArgumentException;

trait SnakeTrait
{


    private function getSnakedOrNull($name): mixed
    {
        $values = (array) $this;

        foreach ($values as $key => $value) {
            if (snake($key) === $name) {
                return $value;
            }
        }

        return null;
    }

    public function __isset($name)
    {
        return $this->getSnakedOrNull($name) !== null;
    }

    public function __get($name)
    {
        $value = $this->getSnakedOrNull($name);

        if ($value !== null) {
            return $value;
        }

        $clazz = get_class($this);

        throw new InvalidArgumentException(
            "The property '{$name}' does not exist on type '{$clazz}'."
        );
    }
}
