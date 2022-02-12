import accounts from '../../accounts-2022.json'

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
    id?: number
    name: string
    transactions: ReadonlyArray<Transaction>
}
type WorkbookV1 = {
    balances: { [A in ExactAccountNumber]?: number }
    name: string
    version: 1
    vouchers: ReadonlyArray<Voucher>
    year: number
}
export type Workbook = WorkbookV1
