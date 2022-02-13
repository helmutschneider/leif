import accounts from '../data/accounts-2022.json'
import * as t from './types'

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

export function calculateAccountBalances(vouchers: ReadonlyArray<t.Voucher>): t.AccountBalanceMap {
    const result: t.AccountBalanceMap = {}
    for (const voucher of vouchers) {
        for (const t of voucher.transactions) {
            const num = t.account
            if (typeof result[num] === 'undefined') {
                result[num] = 0;
            }
            result[num] += t.kind === 'debit'
                ? t.amount
                : (-t.amount);
        }
    }
    return result;
}

export function formatSEK(amount: number): string {
    const intFmt = new Intl.NumberFormat('sv-SE', {
        style: 'decimal',
        useGrouping: true,
    });
    const padded = amount.toString().padStart(3, '0');
    const [int, fraction] = padded.split(/(\d{2})$/);
    const intStr = intFmt.format(parseInt(int ?? '0'));
    return `${intStr},${fraction} kr`;
}

export function getAccountName(account: t.AccountNumber): string {
    return accounts[account as t.ExactAccountNumber];
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

export function tryParseInt<D>(value: string | number, defaultValue: D): number | D {
    let result: number | D
    switch (typeof value) {
        case 'number':
            result = value
            break;
        case 'string':
            result = parseInt(value, 10)
            break;
    }
    if (isNaN(result)) {
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
        switch (t.kind) {
            case 'debit':
                sum += t.amount;
                break;
            case 'credit':
                sum -= t.amount;
                break;
        }
    }

    return sum === 0
}

export function emptyVoucher(): t.Voucher {
    return {
        attachments: [],
        created_at: (new Date()).toISOString(),
        name: '',
        date: formatDate(new Date(), 'yyyy-MM-dd'),
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
