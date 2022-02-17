import * as t from './types'
import {AccountBalance, AccountPlan} from "./types";

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
    })
}

export function ellipsis(value: string, length: number): string {
    if (value.length > length) {
        return value.slice(0, length).trim() + '...';
    }
    return value;
}

export function calculateAccountBalances(vouchers: ReadonlyArray<t.Voucher>, carries: ReadonlyArray<t.AccountBalance> = []): t.AccountBalanceMap {
    const result: t.AccountBalanceMap = carries.reduce((carry, item) => {
        carry[item.account] = item.balance;
        return carry;
    }, {} as t.AccountBalanceMap);
    for (const voucher of vouchers) {
        for (const t of voucher.transactions) {
            const num = t.account
            if (typeof result[num] === 'undefined') {
                result[num] = 0;
            }
            const prev = tryParseInt(result[num], 0)
            const amount = tryParseInt(t.amount, 0)
            result[num] = prev + (t.kind === 'debit' ? amount : (-amount));
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
    const subunit = currency.subunit;
    const pattern = /^(-?\d+)(?:[,.](\d+)?)?$/;
    const matches = pattern.exec(
        amount.replace(/\s/g, '')
    );

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

export function areDebitsAndCreditsBalanced(voucher: t.Voucher): boolean {
    if (voucher.transactions.length < 2) {
        return false
    }

    let sum = 0

    for (const t of voucher.transactions) {
        const amount = tryParseInt(t.amount, 0)

        switch (t.kind) {
            case 'debit':
                sum += amount;
                break;
            case 'credit':
                sum -= amount;
                break;
        }
    }

    return sum === 0
}

export function emptyVoucher(): t.Voucher {
    return {
        attachments: [],
        created_at: (new Date()).toISOString(),
        date: formatDate(new Date(), 'yyyy-MM-dd'),
        is_template: false,
        name: '',
        transactions: [
            { account: 1910, amount: 0, kind: 'debit' },
            { account: 1910, amount: 0, kind: 'credit' },
        ],
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

export function findIdOfMostRecentlyEditedWorkbook(workbooks: ReadonlyArray<t.Workbook>): number | undefined {
    let mostRecentId: number | undefined;
    let max = -1;
    for (const wb of workbooks) {
        const ts = Math.max(
            ...wb.vouchers
                .map(voucher => Date.parse(voucher.created_at))
                .concat(0) // we need something to compare against something even if the voucher list is empty.
        );
        if (ts > max) {
            mostRecentId = tryParseInt(wb.workbook_id, undefined);
            max = ts;
        }
    }
    return mostRecentId;
}

export function findNextUnusedAccountNumber(accounts: AccountPlan, balances: ReadonlyArray<AccountBalance>): number | undefined {
    const largestAccountNumber = Math.max(
        ...balances.map(b => tryParseInt(b.account, 0))
    )
    const accountNumbers = Object.keys(accounts);
    const indexOfLargestAccountNumber = accountNumbers.indexOf(largestAccountNumber.toFixed(0));
    const nextAccountNumber = accountNumbers[indexOfLargestAccountNumber + 1];

    return tryParseInt(nextAccountNumber, undefined)
}
