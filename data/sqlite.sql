CREATE TABLE "organization" (
    "organization_id" INTEGER PRIMARY KEY NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "carry_accounts" TEXT NOT NULL DEFAULT ''
);

CREATE TABLE "migration" (
    "migration_id" INTEGER PRIMARY KEY NOT NULL,
    "name" TEXT NOT NULL,
    "applied_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "user" (
    "user_id" INTEGER PRIMARY KEY NOT NULL,
    "username" TEXT NOT NULL UNIQUE,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT '',
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organization_id" INTEGER NOT NULL,
    FOREIGN KEY ("organization_id")
        REFERENCES "organization" ("organization_id")
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE "token" (
    "token_id" INTEGER PRIMARY KEY NOT NULL,
    "value" BLOB NOT NULL,
    "seen_at" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    FOREIGN KEY ("user_id")
        REFERENCES "user" ("user_id")
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE "voucher" (
    "voucher_id" INTEGER PRIMARY KEY NOT NULL,
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "organization_id" INTEGER NOT NULL,
    "is_template" INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY ("organization_id")
        REFERENCES "organization" ("organization_id")
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE "transaction" (
    "transaction_id" INTEGER PRIMARY KEY NOT NULL,
    "account" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "kind" INTEGER NOT NULL,
    "voucher_id" INTEGER NOT NULL,
    FOREIGN KEY ("voucher_id")
        REFERENCES "voucher" ("voucher_id")
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE "attachment" (
    "attachment_id" INTEGER PRIMARY KEY NOT NULL,
    "name" TEXT NOT NULL,
    "data" BLOB NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "checksum" BLOB NOT NULL,
    "voucher_id" INTEGER NOT NULL,
    FOREIGN KEY ("voucher_id")
        REFERENCES "voucher" ("voucher_id")
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE "invoice_template" (
  "invoice_template_id" INTEGER PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "organization_id" INTEGER NOT NULL,
  "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("organization_id")
    REFERENCES "organization" ("organization_id")
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE TABLE "invoice_dataset" (
  "invoice_dataset_id" INTEGER PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL,
  "vat_rate" REAL NOT NULL,
  "currency_code" TEXT NOT NULL,
  "fields" TEXT NOT NULL,
  "line_items" TEXT NOT NULL,
  "precision" INTEGER NOT NULL,
  "variables" TEXT NOT NULL,
  "organization_id" INTEGER NOT NULL,
  "extends_id" INTEGER DEFAULT NULL,
  "invoice_template_id" INTEGER NOT NULL,
  "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("organization_id")
    REFERENCES "organization" ("organization_id")
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  FOREIGN KEY ("extends_id")
    REFERENCES "invoice_dataset" ("invoice_dataset_id")
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  FOREIGN KEY ("invoice_template_id")
    REFERENCES "invoice_template" ("invoice_template_id")
    ON UPDATE CASCADE
    ON DELETE CASCADE
);