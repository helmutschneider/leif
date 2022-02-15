<?php declare(strict_types=1);

use Symfony\Component\Routing\Loader\Configurator\RoutingConfigurator;

return function (RoutingConfigurator $routes) {
    $routes->add('index', '/')
        ->methods(['GET'])
        ->controller(\Leif\Api\IndexAction::class);

    $routes->add('list_workbooks', '/api/workbook')
        ->methods(['GET'])
        ->controller(\Leif\Api\ListWorkbooksAction::class);

    $routes->add('login', '/api/login')
        ->methods(['POST'])
        ->controller(\Leif\Api\LoginAction::class);

    $routes->add('create_voucher', '/api/voucher')
        ->methods(['POST'])
        ->controller(\Leif\Api\CreateVoucherAction::class);

    $routes->add('get_attachment', '/api/attachment/{id}')
        ->methods(['GET'])
        ->controller(\Leif\Api\GetAttachmentAction::class);
};
