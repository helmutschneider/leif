<?php declare(strict_types=1);

namespace Leif\Database;

use Leif\Database;

interface Migration
{
    public function apply(Database $db): void;
}
