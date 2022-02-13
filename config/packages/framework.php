<?php declare(strict_types=1);

use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;
use Symfony\Config\FrameworkConfig;

return static function (FrameworkConfig $config, ContainerConfigurator $container) {
    $config
        ->secret('%env(base64:APP_SECRET)%')
        ->httpMethodOverride(false);

    $config
        ->phpErrors()
        ->log(true);

    $config
        ->session()
        ->enabled(false);

    if ($container->env() === 'test') {
        $config->test(true);
    }
};
