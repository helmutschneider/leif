<?php declare(strict_types=1);

namespace Leif\Tests\Api;

use Leif\Api\ExpandInvoiceDatasetAction;
use Leif\Database;
use Leif\Security\User;
use Leif\Tests\WebTestCase;
use Symfony\Component\HttpFoundation\Response;

final class InvoiceTemplateTest extends WebTestCase
{
    public function testCreateInvoiceTemplate(): void
    {
        $client = static::createClient();
        static::createUserWithToken($client, 'tester', '1234');

        $body = json_encode([
            'name' => 'yee!',
            'body' => 'boi!',
        ]);
        $client->request('POST', '/api/invoice-template', [], [], [
            'HTTP_AUTHORIZATION' => '1234',
        ], $body);

        $this->assertResponseStatusCodeSame(Response::HTTP_CREATED);
    }

    public function testExpandsTemplates()
    {
        $client = static::createClient();
        $db = $client->getContainer()->get(Database::class);
        assert($db instanceof Database);
        $userId = static::createUser($db, 'tester');
        $organizationId = static::getOrganizationId($db, $userId);

        $db->execute('INSERT INTO invoice_template (name, body, organization_id) VALUES (?, ?, ?)', [
            'yee', '', $db->getLastInsertId()
        ]);

        $fields = <<<TXT
[
  {
    "name": "Yee",
    "key": "a",
    "value": "Yee {{ 1 + variables.my_var }}",
    "is_editable": true
  }
]
TXT;

        $lineItems = <<<TXT
[
  {
    "name": "Line {{ variables.my_var }}",
    "key": "a",
    "price": 0,
    "quantity": 0
  }
]
TXT;


        $db->execute('INSERT INTO invoice_dataset (
          name,
          vat_rate,
          currency_code,
          fields,
          line_items,
          precision,
          variables,
          organization_id,
          extends_id,
          invoice_template_id
        ) VALUES (\'\', 25, \'SEK\', ?, ?, 0, ?, ?, NULL, ?)', [
            $fields,
            $lineItems,
            '{ "my_var": 42 }',
            $organizationId,
            $db->getLastInsertId(),
        ]);

        $datasetId = $db->getLastInsertId();
        $user = new User([
            'organization_id' => $organizationId,
            'user_id' => $userId,
        ]);
        $dataset = ExpandInvoiceDatasetAction::loadAndExpandDataset($db, $user, $datasetId);

        $this->assertSame('Yee 43', $dataset['fields'][0]['value']);
        $this->assertSame('Line 42', $dataset['line_items'][0]['name']);
    }
}
