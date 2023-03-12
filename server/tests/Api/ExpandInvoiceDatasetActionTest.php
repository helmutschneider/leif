<?php declare(strict_types=1);

namespace Leif\Tests\Api;

use Leif\Api\ExpandInvoiceDatasetAction;
use Leif\Database;
use Leif\Security\User;
use Leif\Tests\TestCase;

final class ExpandInvoiceDatasetActionTest extends TestCase
{
    public function fixtures(): array
    {
        return [
            'organization',
            'user',
            'token',
            'invoice_template',
        ];
    }

    public function testExpandsTemplates(): void
    {
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


        $this->db->execute('INSERT INTO invoice_dataset (
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
            1,
            1,
        ]);

        $datasetId = $this->db->getLastInsertId();
        $user = new User([
            'organization_id' => 1,
            'user_id' => 1,
        ]);
        $dataset = ExpandInvoiceDatasetAction::loadAndExpandDataset($this->db, $user, $datasetId);

        $this->assertSame('Yee 43', $dataset['fields'][0]['value']);
        $this->assertSame('Line 42', $dataset['line_items'][0]['name']);
    }

    public function testExtendsParentTemplate(): void
    {
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

        $this->db->execute('INSERT INTO invoice_dataset (
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
            '{ "my_var": 42, "my_other_var": 3 }',
            1,
            1,
        ]);

        $extendsId = $this->db->getLastInsertId();

        $fields = <<<TXT
[
  {
    "name": null,
    "key": "a",
    "value": "SWAGGER {{ 5 + variables.my_var }}",
    "is_editable": true
  }
]
TXT;

        $lineItems = <<<TXT
[
  {
    "name": "JAGGER {{ variables.my_var }}",
    "key": "a",
    "price": 0,
    "quantity": 0
  }
]
TXT;

        $this->db->execute('INSERT INTO invoice_dataset (
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
        ) VALUES (\'\', 25, \'SEK\', ?, ?, 0, ?, ?, ?, ?)', [
            $fields,
            $lineItems,
            '{ "my_var": 69 }',
            1,
            $extendsId,
            1,
        ]);

        $datasetId = $this->db->getLastInsertId();
        $user = new User([
            'organization_id' => 1,
            'user_id' => 1,
        ]);
        $dataset = ExpandInvoiceDatasetAction::loadAndExpandDataset($this->db, $user, $datasetId);

        $this->assertSame('SWAGGER 74', $dataset['fields'][0]['value']);
        $this->assertSame('JAGGER 69', $dataset['line_items'][0]['name']);
        $this->assertSame(69, $dataset['variables']['my_var']);
        $this->assertSame(3, $dataset['variables']['my_other_var']);
    }
}
