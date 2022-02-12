<?php declare(strict_types=1);

namespace Symfony\Component\DependencyInjection\Loader\Configurator;

use PDO;

return static function (ContainerConfigurator $container) {
    $container->services()
        ->defaults()
        ->autowire(true)
        ->autoconfigure(true);

    $container->services()
        ->load('Leif\\', __DIR__ . '/../src/')
        ->exclude([
            __DIR__ . '/../src/DependencyInjection',
            __DIR__ . '/../src/Entity',
            __DIR__ . '/../src/Kernel.php',
        ]);

    $container->services()
        ->set('database', PDO::class)
        ->args([
            'sqlite:%kernel.project_dir%/var/app.db'
        ])
        ->call('exec', ['PRAGMA foreign_keys = ON;'])
        ->alias(PDO::class, 'database');

    $container->services()
        ->load('Leif\\Api\\', __DIR__ . '/../src/Api')
        ->tag('controller.service_arguments')
        ->autowire()
        ->autoconfigure();
};
