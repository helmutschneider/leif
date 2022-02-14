<?php declare(strict_types=1);

use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;
use function Symfony\Component\DependencyInjection\Loader\Configurator\service;

return static function (ContainerConfigurator $container) {
    $services = $container->services();
    $params = $container->parameters();

    $services
        ->defaults()
        ->autowire(true)
        ->autoconfigure(true);

    $services
        ->load('Leif\\', __DIR__ . '/../server/src/')
        ->exclude([
            __DIR__ . '/../server/src/DependencyInjection',
            __DIR__ . '/../server/src/Entity',
            __DIR__ . '/../server/src/Kernel.php',
        ]);

    $services
        ->set('leif.database', PDO::class)
        ->args([
            '%env(resolve:DATABASE_URL)%',
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
        ->load('Leif\\Api\\', __DIR__ . '/../server/src/Api')
        ->tag('controller.service_arguments');

    $params
        ->set('leif.token_ttl', 86_400);

    $services
        ->set(\Leif\Security\TokenUserProvider::class)
        ->args([
            '$ttl' => '%leif.token_ttl%',
        ]);

    $services
        ->load('Leif\\Command\\', __DIR__ . '/../server/src/Command/')
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
        \Leif\Security\HmacHasher::class,
        \Leif\Security\NativeHmacHasher::class
    );

    $services->set(
        \Leif\Database::class,
        \Leif\PDODatabase::class
    );

    $services
        ->set(\Leif\Api\LoginAction::class)
        ->tag('controller.service_arguments')
        ->args([
            '$ttl' => '%leif.token_ttl%',
        ]);
};
