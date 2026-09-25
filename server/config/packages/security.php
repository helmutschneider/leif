<?php declare(strict_types=1);

use Symfony\Component\DependencyInjection\Loader\Configurator\App;
use Symfony\Component\Security\Core\Authorization\Voter\AuthenticatedVoter;

return App::config([
    'security' => [
        'providers' => [
            'leif.user_provider' => [
                'id' => \Leif\Security\TokenUserProvider::class,
            ],
        ],
        'firewalls' => [
            'main' => [
                'lazy' => true,
                'provider' => 'leif.user_provider',
                'custom_authenticators' => [
                    \Leif\Security\TokenAuthenticator::class,
                ],
            ],
        ],
        'access_control' => [
            [
                'path' => '^/api/login',
                'roles' => [
                    AuthenticatedVoter::PUBLIC_ACCESS,
                ],
            ],
            [
                'path' => '^/api',
                'roles' => [
                    AuthenticatedVoter::IS_AUTHENTICATED_FULLY,
                ],
            ],
        ],
    ],
]);
