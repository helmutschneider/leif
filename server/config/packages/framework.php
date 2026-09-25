<?php declare(strict_types=1);

use Symfony\Component\DependencyInjection\Loader\Configurator\App;

return App::config([
    'framework' => [
        'secret' => '%env(base64:APP_SECRET)%',
        'http_method_override' => false,
        'handle_all_throwables' => true,
        'php_errors' => [
            'log' => true,
        ],
        'session' => [
            'enabled' => false,
        ],
        'property_info' => [
            'with_constructor_extractor' => false,
        ],
    ],
    'when@test' => [
        'framework' => [
            'test' => true,
        ],
    ],
]);
