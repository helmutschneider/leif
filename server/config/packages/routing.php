<?php declare(strict_types=1);

use Symfony\Component\DependencyInjection\Loader\Configurator\App;

return App::config([
    'framework' => [
        'router' => [
            'utf8' => true,
            'strict_requirements' => true,
        ],
    ],
]);
