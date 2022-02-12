CREATE TABLE IF NOT EXISTS "user" (
    "user_id" INTEGER PRIMARY KEY NOT NULL,
    "username" TEXT NOT NULL UNIQUE,
    "password_hash" TEXT NOT NULL,
    "created_at" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "workbook" (
    "workbook_id" INTEGER PRIMARY KEY NOT NULL,
    "name" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    FOREIGN KEY ("user_id")
        REFERENCES "user" ("user_id")
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "voucher" (
    "voucher_id" INTEGER PRIMARY KEY NOT NULL,
    "created_at" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "workbook_id" INTEGER NOT NULL,
    FOREIGN KEY ("workbook_id")
        REFERENCES "workbook" ("workbook_id")
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "transaction" (
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

CREATE TABLE IF NOT EXISTS "attachment" (
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