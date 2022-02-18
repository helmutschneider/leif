import * as t from './types'
import {AccountNumber} from "./types";

type DateFormatter = {
    (date: Date): string
};

const dateFormatters: { [pattern: string]: DateFormatter } = {
    "yyyy": (date) => date.getFullYear().toString().padStart(4, '0'),
    "MM": (date) => (date.getMonth() + 1).toString().padStart(2, '0'),
    "dd": (date) => date.getDate().toString().padStart(2, '0'),
}

export function formatDate(date: Date, pattern: string): string {
    const regex = new RegExp(Object.keys(dateFormatters).join('|'), 'g');
    return pattern.replace(regex, (match) => {
        return dateFormatters[match]?.call(undefined, date) ?? ''
    });
}

export function ellipsis(value: string, length: number): string {
    if (value.length > length) {
        return value.slice(0, length).trim() + '...';
    }
    return value;
}

export function calculateAccountBalancesForYear(vouchers: ReadonlyArray<t.Voucher>, year: number, carryAccounts: ReadonlyArray<AccountNumber>): t.AccountBalanceMap {
    const result: t.AccountBalanceMap = {}

    for (const voucher of vouchers) {
        const dt = new Date(voucher.date);
        const voucherYear = dt.getFullYear();

        for (const transaction of voucher.transactions) {
            const account = transaction.account;

            if (typeof account === 'undefined') {
                continue;
            }

            if (year === voucherYear || (voucherYear <= year && carryAccounts.includes(account))) {
                const prev = result[account] ?? 0;
                const amount = transaction.amount;
                result[account] = prev + (transaction.kind === 'debit' ? amount : (-amount));
            }
        }
    }

    return result;
}

export function formatIntegerAsMoneyWithSeparatorsAndSymbol(amount: string | number, currency: t.Currency): string {
    const intFmt = new Intl.NumberFormat(currency.locale, {
        style: 'decimal',
        useGrouping: true,
    });
    const subunit = currency.subunit;
    const num = tryParseInt(amount, 0);
    const padded = num
        .toFixed(0)
        .padStart(3, '0');
    const pattern = new RegExp(`(\\d{${subunit}})$`);
    const [int, fraction] = padded.split(pattern);
    const intStr = intFmt.format(tryParseInt(int, 0));
    return `${intStr}${currency.decimalSeparator}${fraction} ${currency.symbol}`;
}

export function formatIntegerAsMoneyDecimal(amount: number | string, currency: t.Currency): string {
    const subunit = currency.subunit;
    const parsed = tryParseInt(amount, 0);
    const padded = parsed
        .toFixed(0)
        .padStart(subunit + 1, '0');
    const pattern = new RegExp(`(\\d{${subunit}})$`);
    const [int, fraction] = padded.split(pattern);
    return int + currency.decimalSeparator + fraction;
}

export function monetaryAmountToInteger(amount: string, currency: t.Currency): number {
    amount = amount.replace(/[^-\d,.]/g, '')

    const subunit = currency.subunit;
    const pattern = /^(-?\d+)(?:[,.](\d+)?)?$/;
    const matches = pattern.exec(amount);

    if (matches === null) {
        return 0;
    }

    const intPart = matches[1];
    const fractionPart = (matches[2] ?? '').padEnd(subunit, '0');

    return tryParseInt(intPart + fractionPart, 0);
}

export function ensureHasEmptyTransaction(transactions: ReadonlyArray<t.Transaction>): ReadonlyArray<t.Transaction> {
    const last = transactions[transactions.length - 1]
    if (typeof last === 'undefined' || last.amount !== 0) {
        return transactions.concat({
            account: 1910,
            amount: 0,
            kind: 'debit',
        })
    }
    return transactions
}

export function tryParseInt<D>(value: string | number | undefined, defaultValue: D): number | D {
    let result: number | D
    switch (typeof value) {
        case 'number':
            result = value;
            break;
        case 'string':
            result = parseInt(value, 10);
            break;
        case 'undefined':
            result = defaultValue;
            break;
    }
    if (typeof result === 'number' && isNaN(result)) {
        result = defaultValue
    }
    return result
}

export function sumOfTransactions(transactions: ReadonlyArray<t.Transaction>): number {
    let sum = 0;
    for (const t of transactions) {
        switch (t.kind) {
            case 'debit':
                sum += t.amount;
                break;
            case 'credit':
                sum -= t.amount;
                break;
            default:
                throw new Error(`Invalid transaction kind '${t.kind}'.`);
        }
    }
    return sum;
}

export function areDebitsAndCreditsBalanced(voucher: t.Voucher): boolean {
    if (voucher.transactions.length < 2) {
        return false
    }

    return sumOfTransactions(voucher.transactions) === 0;
}

export function emptyVoucher(): t.Voucher {
    return {
        attachments: [],
        created_at: '',
        date: formatDate(new Date(), 'yyyy-MM-dd'),
        is_template: false,
        name: '',
        notes: '',
        transactions: [
            { account: 1910, amount: 0, kind: 'debit' },
            { account: 1910, amount: 0, kind: 'credit' },
        ],
        updated_at: '',
    }
}

export function toArray<T>(stuff: ArrayLike<T>): ReadonlyArray<T> {
    return Array.prototype.slice.call(stuff);
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]!);
    }
    return window.btoa(binary);
}

export function findYearOfMostRecentlyEditedVoucher(workbook: t.Workbook): number | undefined {
    let mostRecentlyEditedYear: number | undefined
    let max = -1;

    const stuff = workbook.vouchers.concat(workbook.templates);

    for (const voucher of stuff) {
        const ts = Date.parse(voucher.updated_at);

        if (ts > max) {
            mostRecentlyEditedYear = (new Date(voucher.date)).getFullYear();
            max = ts;
        }
    }

    return mostRecentlyEditedYear;
}

export function objectContains<T>(value: T, search: string) {
    if (typeof value === 'undefined' || value === null) {
        return false;
    }
    if (typeof value === 'object') {
        for (const key in value) {
            if (!Object.prototype.hasOwnProperty.call(value, key)) {
                continue;
            }
            if (objectContains(value[key], search)) {
                return true;
            }
        }
        return false;
    }
    return String(value)
        .toLowerCase()
        .includes(search.toLowerCase());
}
