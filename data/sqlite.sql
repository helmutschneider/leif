CREATE TABLE "organization" (
  "organization_id" INTEGER PRIMARY KEY NOT NULL,
  "name" TEXT NOT NULL,
  "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "user" (
  "user_id" INTEGER PRIMARY KEY NOT NULL,
  "username" TEXT NOT NULL,
  "password" BLOB NOT NULL,
  "organization_id" INTEGER NOT NULL,
  "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("organization_id")
    REFERENCES "organization"("organization_id")
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE TABLE "accounting_period" (
  "accounting_period_id" INTEGER PRIMARY KEY NOT NULL,
  "start" TEXT NOT NULL,
  "end" TEXT NOT NULL,
  "organization_id" INTEGER NOT NULL,
  FOREIGN KEY ("organization_id")
    REFERENCES "organization"("organization_id")
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE TABLE account (
  "account_id" INTEGER PRIMARY KEY NOT NULL,
  "number" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "type" INTEGER NOT NULL DEFAULT 0,
  "accounting_period_id" INTEGER NOT NULL,
  FOREIGN KEY ("accounting_period_id")
    REFERENCES "accounting_period"("accounting_period_id")
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  UNIQUE ("number", "accounting_period_id")
);

CREATE TABLE "verification" (
  "verification_id" INTEGER PRIMARY KEY NOT NULL,
  "date" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "accounting_period_id" INTEGER NOT NULL,
  "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("accounting_period_id")
    REFERENCES "accounting_period"("accounting_period_id")
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE TABLE "transaction" (
  "transaction_id" INTEGER PRIMARY KEY NOT NULL,
  "amount" INTEGER NOT NULL,
  "account_id" INTEGER NOT NULL,
  "verification_id" INTEGER NOT NULL,
  FOREIGN KEY ("account_id")
    REFERENCES "account"("account_id")
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  FOREIGN KEY ("verification_id")
    REFERENCES "verification"("verification_id")
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE TABLE "token" (
  "token_id" INTEGER PRIMARY KEY NOT NULL,
  "selector" BLOB NOT NULL,
  "verifier" BLOB NOT NULL,
  "type" INTEGER NOT NULL,
  "data" TEXT NOT NULL DEFAULT '',
  "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_seen" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("selector")
);
