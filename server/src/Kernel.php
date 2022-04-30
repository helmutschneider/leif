<?php declare(strict_types=1);

namespace Leif;

use Symfony\Bundle\FrameworkBundle\Kernel\MicroKernelTrait;
use Symfony\Component\Config\Builder\ConfigBuilderGenerator;
use Symfony\Component\Config\Loader\DelegatingLoader;
use Symfony\Component\Config\Loader\LoaderInterface;
use Symfony\Component\Config\Loader\LoaderResolver;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\DependencyInjection\Loader\ClosureLoader;
use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;
use Symfony\Component\HttpKernel\Kernel as BaseKernel;
use Symfony\Component\Routing\Loader\Configurator\RoutingConfigurator;

final class Kernel extends BaseKernel
{
    use MicroKernelTrait;

    private function getConfigDir(): string
    {
        return $this->getProjectDir() . '/server/config';
    }

    private function configureContainer(ContainerConfigurator $container, LoaderInterface $loader, ContainerBuilder $builder): void
    {
        $configDir = $this->getConfigDir();
        $container->import($configDir.'/{packages}/*.php');
        $container->import($configDir.'/{packages}/'.$this->environment.'/*.php');
        $container->import($configDir.'/{services}.php');
    }

    private function configureRoutes(RoutingConfigurator $routes): void
    {
        // die('ye');
        $configDir = $this->getConfigDir();
        $routes->import($configDir.'/{routes}/'.$this->environment.'/*.php');
        $routes->import($configDir.'/{routes}/*.php');
        $routes->import($configDir.'/{routes}.php');
    }
}
