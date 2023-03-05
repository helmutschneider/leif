<?php declare(strict_types = 1);

namespace Leif\Database;

use Exception;
use Leif\Database;

final class Migration_20230305_1714_InvoiceTemplates implements Migration
{
    const CREATE_INVOICE_DATASETS = <<<TXT
CREATE TABLE "invoice_dataset" (
  "invoice_dataset_id" INTEGER PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL,
  "data" TEXT NOT NULL,
  "organization_id" INTEGER NOT NULL,
  "extends_id" INTEGER DEFAULT NULL,
  "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("organization_id")
    REFERENCES "organization" ("organization_id")
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  FOREIGN KEY ("extends_id")
    REFERENCES "invoice_dataset" ("invoice_dataset_id")
    ON UPDATE CASCADE
    ON DELETE CASCADE
);
TXT;

    const CREATE_INVOICE_TEMPLATES = <<<TXT
CREATE TABLE "invoice_template" (
  "invoice_template_id" INTEGER PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL,
  "data" TEXT NOT NULL,
  "organization_id" INTEGER NOT NULL,
  "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("organization_id")
    REFERENCES "organization" ("organization_id")
    ON UPDATE CASCADE
    ON DELETE CASCADE
);
TXT;

    public function apply(Database $db): void
    {
        $db->execute(static::CREATE_INVOICE_DATASETS);
        $db->execute(static::CREATE_INVOICE_TEMPLATES);
    }
}
