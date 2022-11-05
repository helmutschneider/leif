<?php declare(strict_types=1);

namespace Deployer;

use Symfony\Component\Dotenv\Dotenv;

require __DIR__ . '/vendor/autoload.php';
require 'recipe/symfony.php';

$env = new Dotenv();
$env->loadEnv(__DIR__ . '/.env');

// Configuration
set('ssh_type', 'native');
set('ssh_multiplexing', true);
set('repository', 'https://github.com/helmutschneider/leif.git');

add('shared_files', [
    '.env.local',
    'app.db',
]);
// add('shared_dirs', []);
// add('writable_dirs', ['var']);

set('writable_chmod_mode', 775);
set('keep_releases', 3);

// Servers
host('production')
    ->setHostname($_ENV['DEPLOY_HOST'])
    ->setPort($_ENV['DEPLOY_PORT'])
    ->setLabels([
        'stage' => 'production',
    ])
    ->setRemoteUser('deployer')
    ->setDeployPath($_ENV['DEPLOY_PATH']);

// Tasks
task('build_app', function () {
    within('{{release_path}}', function () {
        run('npm ci --production');
        run('npm run build');

        // save space!
        run('rm -rf node_modules');
    });
});

// Display success message on completion
after('deploy:failed', 'deploy:unlock');
after('deploy:vendors', 'build_app');
