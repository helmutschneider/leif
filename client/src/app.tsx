import * as React from 'react'
import * as ReactDOM from 'react-dom'
import accounts from '../../accounts-2022.json'

type AccountNumber = string | number;
type ExactAccountNumber = keyof typeof accounts;
type AccountBalanceMap = {
    [key: AccountNumber]: number
};

function ellipsis(value: string, length: number): string {
    if (value.length > length) {
        return value.slice(0, length).trim() + '...';
    }
    return value;
}

function calculateAccountBalances(vouchers: ReadonlyArray<Voucher>): AccountBalanceMap {
    const result: AccountBalanceMap = {}
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

function formatSEK(amount: number): string {
    const intFmt = new Intl.NumberFormat('sv-SE', {
        style: 'decimal',
        useGrouping: true,
    });
    const padded = amount.toString().padStart(3, '0');
    const [int, fraction] = padded.split(/(\d{2})$/);
    const intStr = intFmt.format(parseInt(int ?? '0'));
    return `${intStr},${fraction} kr`;
}

function getAccountName(account: AccountNumber): string {
    return accounts[account as ExactAccountNumber];
}

type Props = {}
type State = {
    new_voucher: Voucher
    vouchers: ReadonlyArray<Voucher>
}

const App: React.FC<Props> = props => {
    const [state, setState] = React.useState<State>({
        new_voucher: {
            date: '2022-02-09',
            name: '',
            transactions: [
                {
                    account: 1910,
                    amount: 0,
                    kind: 'debit',
                },
            ],
        },
        vouchers: [
            {
                date: '2022-01-01',
                name: 'Bankavgift',
                transactions: [
                    {
                        account: 1910,
                        amount: 7000,
                        kind: 'credit',
                    },
                    {
                        account: 6570,
                        amount: 7000,
                        kind: 'debit',
                    },
                ],
            },
        ],
    })

    const balances = calculateAccountBalances(state.vouchers);
    const accountOptions = Object.entries(accounts).map((e, idx) => {
        return (
            <option key={idx} value={e[0]}>
                {e[0]}: {e[1]}
            </option>
        )
    })

    return (
        <div>
            <nav className="navbar navbar-dark bg-dark">
                <div className="container">
                    <span className="navbar-brand">Leif bokföring</span>
                </div>
            </nav>

            <div className="container pt-3">
                <div className="row">
                    <div className="col-8">
                        <div className="mb-3">
                            <h5>Lägg till verifikat</h5>
                            <div className="mb-3">
                                <label className="form-label">Namn</label>
                                <input
                                    className="form-control"
                                    placeholder="Namn"
                                    type="text"
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Datum</label>
                                <input
                                    className="form-control"
                                    placeholder="Datum"
                                    type="text"
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Transaktioner</label>
                                <table className="table table-sm">
                                    <thead>
                                        <tr>
                                            <th className="col-4">Konto</th>
                                            <th>Debit</th>
                                            <th>Kredit</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {state.new_voucher.transactions.map((t, idx) => {
                                            return (
                                                <tr key={idx}>
                                                    <td>
                                                        <select
                                                            className="form-control"
                                                            value={t.account}>
                                                            {accountOptions}
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <input
                                                            className="form-control"
                                                            placeholder="Debit"
                                                            type="text"
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            className="form-control"
                                                            placeholder="Kredit"
                                                            type="text"
                                                        />
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                        <tr>
                                            <td colSpan={3}>
                                                <div className="d-grid">
                                                    <button className="btn btn-success btn-sm">Bruh!</button>
                                                </div>

                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <h5>Verifikat</h5>
                        <table className="table table-sm">
                            <tbody>
                                {state.vouchers.map((voucher, idx) => {
                                    return (
                                        <tr key={idx}>
                                            <td className="col-2">{voucher.date}</td>
                                            <td>{voucher.name}</td>
                                            <td></td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="col">
                        <h5>Kontobalans</h5>
                        <table className="table table-sm">
                            <tbody>
                                {Object.entries(balances).map((e, idx) => {
                                    const accountName = getAccountName(e[0]);
                                    return (
                                        <tr key={idx}>
                                            <td>{e[0]}</td>
                                            <td>
                                                <span title={accountName}>
                                                    {ellipsis(accountName, 30)}
                                                </span>
                                            </td>
                                            <td className="text-end">{formatSEK(e[1])}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

type Transaction = {
    account: AccountNumber
    amount: number
    kind: 'credit' | 'debit'
}

type Voucher = {
    date: string
    name: string
    transactions: ReadonlyArray<Transaction>
}

const root = document.getElementById('app');
ReactDOM.render(<App />, root);
