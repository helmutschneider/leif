CREATE TABLE `organization` (
  `organization_id` INTEGER UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL COLLATE utf8mb4_unicode_ci,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `user` (
  `user_id` INTEGER UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(255) NOT NULL COLLATE utf8mb4_unicode_ci,
  `password` BINARY(54) NOT NULL,
  `organization_id` INTEGER UNSIGNED NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`organization_id`) REFERENCES `organization`(`organization_id`) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE `accounting_period` (
  `accounting_period_id` INTEGER UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `start` DATE NOT NULL,
  `end` DATE NOT NULL,
  `organization_id` INTEGER UNSIGNED NOT NULL,
  FOREIGN KEY (`organization_id`) REFERENCES `organization`(`organization_id`) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE `account` (
  `account_id` INTEGER UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `number` INTEGER UNSIGNED NOT NULL,
  `description` VARCHAR(255) NOT NULL COLLATE utf8mb4_unicode_ci,
  `type` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `accounting_period_id` INTEGER UNSIGNED NOT NULL,
  FOREIGN KEY (`accounting_period_id`) REFERENCES `accounting_period`(`accounting_period_id`) ON UPDATE CASCADE ON DELETE CASCADE,
  UNIQUE KEY (`number`, `accounting_period_id`)
);

CREATE TABLE `verification` (
  `verification_id` INTEGER UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `date` DATE NOT NULL,
  `description` VARCHAR(255) NOT NULL COLLATE utf8mb4_unicode_ci,
  `accounting_period_id` INTEGER UNSIGNED NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`accounting_period_id`) REFERENCES `accounting_period`(`accounting_period_id`) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE `transaction` (
  `transaction_id` INTEGER UNSIGNED PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `amount` BIGINT NOT NULL,
  `account_id` INTEGER UNSIGNED NOT NULL,
  `verification_id` INTEGER UNSIGNED NOT NULL,
  FOREIGN KEY (`account_id`) REFERENCES `account`(`account_id`) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (`verification_id`) REFERENCES `verification`(`verification_id`) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE `token` (
  `token_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `selector` BINARY(16) NOT NULL,
  `verifier` BINARY(32) NOT NULL,
  `type` TINYINT UNSIGNED NOT NULL,
  `data` TEXT COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT (''),
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_seen` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`token_id`),
  UNIQUE KEY `selector` (`selector`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
