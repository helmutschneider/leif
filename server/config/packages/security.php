<?php declare(strict_types=1);

use Symfony\Config\SecurityConfig;
use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;
use Symfony\Component\Security\Core\Authorization\Voter\AuthenticatedVoter;

return static function (SecurityConfig $config, ContainerConfigurator $container) {
    $config
        ->enableAuthenticatorManager(true);

    $config->provider('leif.user_provider')
        ->id(\Leif\Security\TokenUserProvider::class);

    $config->firewall('main')
        ->lazy(true)
        ->provider('leif.user_provider')
        ->customAuthenticators([
            \Leif\Security\TokenAuthenticator::class,
        ]);

    $config->accessControl()
        ->path('^/api/login')
        ->roles([
            AuthenticatedVoter::PUBLIC_ACCESS,
        ]);

    $config->accessControl()
        ->path('^/api')
        ->roles([
            AuthenticatedVoter::IS_AUTHENTICATED_FULLY,
        ]);
};
