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
        ->load('Leif\\', __DIR__ . '/../src/')
        ->exclude([
            __DIR__ . '/../src/DependencyInjection',
            __DIR__ . '/../src/Entity',
            __DIR__ . '/../src/Kernel.php',
            __DIR__ . '/../src/functions.php',
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
        ->load('Leif\\Api\\', __DIR__ . '/../src/Api')
        ->tag('controller.service_arguments');

    $params
        ->set('leif.token_ttl', 86_400);

    $services
        ->set(\Leif\Security\TokenUserProvider::class)
        ->args([
            '$ttl' => '%leif.token_ttl%',
        ]);

    $services
        ->load('Leif\\Command\\', __DIR__ . '/../src/Command/')
        ->tag('console.command');

    $services
        ->set(\Leif\Command\MigrateCommand::class)
        ->args([
            '$migrationsPath' => __DIR__ . '/../src/Database',
            '$migrationsNamespace' => 'Leif\\Database\\',
        ]);

    $services
        ->set(\Leif\Command\CreateMigrationCommand::class)
        ->args([
            '$migrationsPath' => __DIR__ . '/../src/Database',
        ]);

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
            '$cost' => $container->env() === 'test'
                ? 4
                : 15,
        ]);

    $services
        ->set(
            \Leif\Security\HmacHasher::class,
            \Leif\Security\NativeHmacHasher::class
        )
        ->public();

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

    $version = 'dev-master';
    $revisionFile = __DIR__ . '/../../REVISION';

    if (file_exists($revisionFile)) {
        $version = mb_substr(trim(file_get_contents($revisionFile)), 0, 7, 'utf-8');
    } else {
        $descriptors = [
            0 => ['pipe', 'r'],
            1 => ['pipe', 'w'],
            2 => ['pipe', 'w'],
        ];
        $proc = proc_open('git -C "${APP_PATH}" rev-parse --short HEAD', $descriptors, $pipes, null, [
            'APP_PATH' => __DIR__,
        ]);

        if ($proc !== false) {
            $version = stream_get_contents($pipes[1]);
            $err = stream_get_contents($pipes[2]);

            if ($err) {
                throw new RuntimeException("Could not read version from 'REVISION' or git.\n{$err}");
            }

            foreach ($pipes as $pipe) {
                fclose($pipe);
            }

            proc_close($proc);
        }
    }

    $services
        ->set(\Leif\ResponseListener::class)
        ->tag('kernel.event_listener', [
            'event' => \Symfony\Component\HttpKernel\KernelEvents::RESPONSE,
        ])
        ->args([
            [
                'Build-Date' => date('c'),
                'Build-Environment' => $container->env(),
                'Build-Version' => trim($version),
            ],
        ]);
};
