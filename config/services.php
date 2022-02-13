<?php declare(strict_types=1);

use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;
use function Symfony\Component\DependencyInjection\Loader\Configurator\service;

return static function (ContainerConfigurator $container) {
    $services = $container->services();
    $services
        ->defaults()
        ->autowire(true)
        ->autoconfigure(true);

    $services
        ->load('Leif\\', __DIR__ . '/../server/')
        ->exclude([
            __DIR__ . '/../server/DependencyInjection',
            __DIR__ . '/../server/Entity',
            __DIR__ . '/../server/Kernel.php',
        ]);

    $services
        ->set('leif.database', PDO::class)
        ->args([
            'sqlite:%kernel.project_dir%/var/app.db',
            '',
            '',
            [
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_EMULATE_PREPARES => false,
            ],
        ])
        ->call('exec', ['PRAGMA foreign_keys = ON;'])
        ->alias(PDO::class, 'leif.database');

    $services
        ->load('Leif\\Api\\', __DIR__ . '/../server/Api')
        ->tag('controller.service_arguments');

    $services
        ->set(\Leif\Security\TokenUserProvider::class)
        ->args([
            '$ttl' => 86_400,
        ]);

    $services
        ->load('Leif\\Command\\', __DIR__ . '/../server/Command/')
        ->tag('console.command');

    $services
        ->set(\Leif\Security\SecretKey::class)
        ->args([
            '%kernel.secret%',
        ]);

    $services
        ->set(
            \Symfony\Component\PasswordHasher\PasswordHasherInterface::class,
            \Symfony\Component\PasswordHasher\Hasher\NativePasswordHasher::class
        )
        ->args([
            '$cost' => 15,
        ]);

    $services->set(
        \Leif\Security\HmacHasherInterface::class,
        \Leif\Security\NativeHmacHasher::class
    );
};
