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
  account_balances: AccountBalanceMap
  currency: CurrencyCode
  invoice_datasets: ReadonlyArray<InvoiceDataset>
  invoice_templates: ReadonlyArray<InvoiceTemplate>
  organization: Organization
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
export const currencies: { [P in CurrencyCode]: Currency } = {
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
export type InvoiceTemplate = {
  invoice_template_id?: number
  name: string
  body: string
}
export type InvoiceField = {
  name: string
  key: string
  value: string
  is_editable: boolean
}
export type InvoiceLineItem = {
  name: string
  key: string
  price: number
  quantity: number
}
export type MapLike<T> = {
  readonly [key: string]: T
}
export type InvoiceDataset = {
  invoice_dataset_id?: number
  name: string
  vat_rate: number
  currency_code: CurrencyCode
  fields: ReadonlyArray<InvoiceField>
  line_items: ReadonlyArray<InvoiceLineItem>
  precision: number
  variables: MapLike<string>
  extends_id?: number
  invoice_template_id?: number
}
