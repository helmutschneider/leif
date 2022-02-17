![Build status](https://github.com/helmutschneider/leif/workflows/build/badge.svg)

# Leif: a tiny bookkeeping application

Leif is an extremely simple dual-entry bookkeeping application. I wrote the app out of
my frustration with most commercial bookkeeping software; they are usually super complex,
hard to use and has tons of features that the regular user will never need. This application
is designed to do one thing and do it well which is to keep track of your expenses.

Leif is architected as a web app with a classic client-server architecture. The backend is
used as a stupid data store where most computation is done by the frontend. Everything is
persisted to a single SQLite database which makes backups fast and easy. The frontend
only supports the Swedish language at the moment but that may change in the future.

## Features
- Dual-entry bookkeeping with vouchers & transactions
- Account balances calculated by year
- File attachments
- Voucher templates
- Carry-forward accounts (user configurable)

## Requirements
- NodeJS 14+
- PHP 7.4+
- SQLite3

## Running
```shell
composer install
npm ci
npm start
```
After the server has started you can navigate to http://localhost:8000 in your browser.

## License
MIT
