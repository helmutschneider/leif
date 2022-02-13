<?php declare(strict_types=1);

use Symfony\Component\Routing\Loader\Configurator\RoutingConfigurator;

return function (RoutingConfigurator $routes) {
    $routes->add('index', '/')
        ->methods(['GET'])
        ->controller(\Leif\Api\IndexAction::class);

    $routes->add('list_workbooks', '/api/workbooks')
        ->methods(['GET'])
        ->controller(\Leif\Api\ListWorkbooksAction::class);
};
