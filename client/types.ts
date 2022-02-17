export type AccountNumber = string | number;
export type AccountBalanceMap = {
    [key: AccountNumber]: number | string
};
export type Transaction = {
    account: AccountNumber
    amount: number | string
    kind: 'credit' | 'debit'
}
type Base64String = string
export type Attachment = {
    attachment_id?: number | string
    name: string
    mime: string
    data: Base64String
    size: number
}
export type Voucher = {
    attachments: ReadonlyArray<Attachment>
    created_at: string
    date: string
    name: string
    transactions: ReadonlyArray<Transaction>
    voucher_id?: number | string
    workbook_id?: number | string
}
export type Workbook = {
    balance_carry: AccountBalanceMap
    name: string
    vouchers: ReadonlyArray<Voucher>
    year: number
    workbook_id?: number | string
}
export type User = {
    user_id?: string | number
    username: string
    token: string
}
export type CurrencyCode =
    | 'SEK'
export type Currency = {
    code: string
    decimalSeparator: string
    locale: string
    subunit: number
    symbol: string
    thousandsSeparator: string
}
export const currencies: {[P in CurrencyCode]: Currency} = {
    SEK: {
        code: 'SEK',
        decimalSeparator: ',',
        locale: 'sv-SE',
        subunit: 2,
        symbol: 'kr',
        thousandsSeparator: ' ',
    },
}
export type Account = {
    name: string
    number: number | string
}
export type AccountBalance = {
    account: number
    balance: number
}
export enum KeyCode {
    ArrowDown = 40,
    ArrowUp = 38,
    Enter = 13,
    Escape = 27,
}
