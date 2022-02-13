import accounts from '../data/accounts-2022.json'

export type AccountNumber = string | number;
export type ExactAccountNumber = keyof typeof accounts;
export type AccountBalanceMap = {
    [key: AccountNumber]: number
};
export type Transaction = {
    account: AccountNumber
    amount: number
    kind: 'credit' | 'debit'
}
type Base64String = string
export type Attachment = {
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
    balances: { [A in ExactAccountNumber]?: number }
    name: string
    vouchers: ReadonlyArray<Voucher>
    year: number
    workbook_id?: number | string
}
export type User = {
    username: string
    token: string
}
