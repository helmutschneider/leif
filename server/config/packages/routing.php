<?php declare(strict_types=1);

use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;
use Symfony\Config\FrameworkConfig;

return static function (FrameworkConfig $config, ContainerConfigurator $container) {
    $config
        ->router()
        ->utf8(true);

    # Configure how to generate URLs in non-HTTP contexts, such as CLI commands.
    # See https://symfony.com/doc/current/routing.html#generating-urls-in-commands
    # default_uri: http://localhost

    if ($container->env() === 'prod') {
        $config
            ->router()
            ->strictRequirements(null);
    }
};
