<?php declare(strict_types=1);

namespace Symfony\Component\DependencyInjection\Loader\Configurator;

return static function (ContainerConfigurator $container) {
    $container->extension('framework', [
        'router' => [
            'utf8' => true,

            # Configure how to generate URLs in non-HTTP contexts, such as CLI commands.
            # See https://symfony.com/doc/current/routing.html#generating-urls-in-commands
            # default_uri: http://localhost
        ],
    ]);

    if ($container->env() === 'prod') {
        $container->extension('framework', [
            'router' => [
                'strict_requirements' => null,
            ],
        ]);
    }
};
