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
        ->requirements([
            'id' => '\d+',
        ])
        ->controller(\Leif\Api\DeleteVoucherAction::class);

    $routes->add('update_voucher', '/api/voucher/{id}')
        ->methods(['PUT'])
        ->requirements([
            'id' => '\d+',
        ])
        ->controller(\Leif\Api\UpdateVoucherAction::class);

    $routes->add('get_attachment', '/api/attachment/{id}')
        ->methods(['GET'])
        ->requirements([
            'id' => '\d+',
        ])
        ->controller(\Leif\Api\GetAttachmentAction::class);

    $routes->add('install', '/install')
        ->methods(['GET', 'POST'])
        ->controller(\Leif\Api\InstallAction::class);

    $routes->add('update_user', '/api/user/{id}')
        ->methods(['PUT'])
        ->requirements([
            'id' => '\d+',
        ])
        ->controller(\Leif\Api\UpdateUserAction::class);

    $routes->add('create_invoice_template', '/api/invoice-template')
        ->methods(['POST'])
        ->controller(\Leif\Api\CreateInvoiceTemplateAction::class);

    $routes->add('update_invoice_template', '/api/invoice-template/{id}')
        ->methods(['PUT'])
        ->requirements([
            'id' => '\d+',
        ])
        ->controller(\Leif\Api\UpdateInvoiceTemplateAction::class);

    $routes->add('delete_invoice_template', '/api/invoice-template/{id}')
        ->methods(['DELETE'])
        ->requirements([
            'id' => '\d+',
        ])
        ->controller(\Leif\Api\DeleteInvoiceTemplateAction::class);

    $routes->add('create_invoice_dataset', '/api/invoice-dataset')
        ->methods(['POST'])
        ->controller(\Leif\Api\CreateInvoiceDatasetAction::class);

    $routes->add('update_invoice_dataset', '/api/invoice-dataset/{id}')
        ->methods(['PUT'])
        ->controller(\Leif\Api\UpdateInvoiceDatasetAction::class);

    $routes->add('delete_invoice_dataset', '/api/invoice-dataset/{id}')
        ->methods(['DELETE'])
        ->requirements([
            'id' => '\d+',
        ])
        ->controller(\Leif\Api\DeleteInvoiceDatasetAction::class);

    $routes->add('expand_invoice_dataset', '/api/invoice-dataset/{id}/expand')
        ->methods(['POST'])
        ->requirements([
            'id' => '\d+',
        ])
        ->controller(\Leif\Api\ExpandInvoiceDatasetAction::class);

    $routes->add('render_invoice', '/api/invoice/render')
        ->methods(['POST'])
        ->controller(\Leif\Api\RenderInvoiceAction::class);
};
