export type AccountNumber = number

// monetary values are expressed as integers in the subunit
// of the currency. for example, the subunit of USD is the
// cent so $1.00 would be expressed as the integer 100.
//
// not all currencies have subunits however; 100 JPY would
// simply be expressed as 100.
type Money = number
type CommaSeparatedString = string
export type Transaction = {
    account: AccountNumber
    amount: Money
    kind: 'credit' | 'debit'
}
type Base64String = string
export type Attachment = {
    attachment_id?: number
    name: string
    mime: string
    data: Base64String
    size: number
}
export type Voucher = {
    attachments: ReadonlyArray<Attachment>
    created_at: string
    date: string
    is_template: boolean
    name: string
    notes: string
    transactions: ReadonlyArray<Transaction>
    updated_at: string
    voucher_id?: number
}
export type Workbook = {
    accounts: AccountPlan
    currency: CurrencyCode
    templates: ReadonlyArray<Voucher>
    vouchers: ReadonlyArray<Voucher>
}
export type Organization = {
    organization_id?: number
    name: string
    carry_accounts: CommaSeparatedString
}
export type User = {
    user_id?: number
    username: string
    role: string
    token: string
    organization: Organization
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
export type AccountBalance = {
    account: AccountNumber
    balance: Money
}
export enum KeyCode {
    ArrowDown = 40,
    ArrowLeft = 37,
    ArrowRight = 39,
    ArrowUp = 38,
    Enter = 13,
    Escape = 27,
}
export type AccountBalanceMap = {
    [key: AccountNumber | string]: number
}
export type AccountPlan = {
    [key: AccountNumber | string]: string
}
export type BackendError = {
    message: string
}
