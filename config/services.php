<?php declare(strict_types=1);

use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;

return static function (ContainerConfigurator $container) {
    $container->services()
        ->defaults()
        ->autowire(true)
        ->autoconfigure(true);

    $container->services()
        ->load('Leif\\', __DIR__ . '/../server/')
        ->exclude([
            __DIR__ . '/../server/DependencyInjection',
            __DIR__ . '/../server/Entity',
            __DIR__ . '/../server/Kernel.php',
        ]);

    $container->services()
        ->set('database', PDO::class)
        ->args([
            'sqlite:%kernel.project_dir%/var/app.db'
        ])
        ->call('exec', ['PRAGMA foreign_keys = ON;'])
        ->alias(PDO::class, 'database');

    $container->services()
        ->load('Leif\\Api\\', __DIR__ . '/../server/Api')
        ->tag('controller.service_arguments')
        ->autowire()
        ->autoconfigure();
};
