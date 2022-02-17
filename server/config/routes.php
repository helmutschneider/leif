<?php declare(strict_types=1);

use Symfony\Component\Routing\Loader\Configurator\RoutingConfigurator;

return function (RoutingConfigurator $routes) {
    $routes->add('index', '/')
        ->methods(['GET'])
        ->controller(\Leif\Api\IndexAction::class);

    $routes->add('get_workbook', '/api/workbook')
        ->methods(['GET'])
        ->controller(\Leif\Api\GetWorkbookAction::class);

    $routes->add('login', '/api/login')
        ->methods(['POST'])
        ->controller(\Leif\Api\LoginAction::class);

    $routes->add('create_voucher', '/api/voucher')
        ->methods(['POST'])
        ->controller(\Leif\Api\CreateVoucherAction::class);

    $routes->add('delete_voucher', '/api/voucher/{id}')
        ->methods(['DELETE'])
        ->controller(\Leif\Api\DeleteVoucherAction::class);

    $routes->add('update_voucher', '/api/voucher/{id}')
        ->methods(['PUT'])
        ->controller(\Leif\Api\UpdateVoucherAction::class);

    $routes->add('get_attachment', '/api/attachment/{id}')
        ->methods(['GET'])
        ->controller(\Leif\Api\GetAttachmentAction::class);

    $routes->add('install', '/install')
        ->methods(['GET', 'POST'])
        ->controller(\Leif\Api\InstallAction::class);

    $routes->add('update_user', '/api/user/{id}')
        ->methods(['PUT'])
        ->controller(\Leif\Api\UpdateUserAction::class);
};
