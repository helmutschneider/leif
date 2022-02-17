CREATE TABLE "user" (
    "user_id" INTEGER PRIMARY KEY NOT NULL,
    "username" TEXT NOT NULL UNIQUE,
    "password_hash" TEXT NOT NULL,
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
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

CREATE TABLE "workbook" (
    "workbook_id" INTEGER PRIMARY KEY NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
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
    "workbook_id" INTEGER NOT NULL,
    "is_template" INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY ("workbook_id")
        REFERENCES "workbook" ("workbook_id")
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
    "voucher_id" INTEGER NOT NULL,
    FOREIGN KEY ("voucher_id")
        REFERENCES "voucher" ("voucher_id")
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE "account_carry" (
    "account_carry_id" INTEGER PRIMARY KEY NOT NULL,
    "account" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL,
    "workbook_id" INTEGER NOT NULL,
    FOREIGN KEY ("workbook_id")
        REFERENCES "workbook" ("workbook_id")
        ON UPDATE CASCADE
        ON DELETE CASCADE
);
