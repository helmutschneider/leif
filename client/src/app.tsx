import * as React from 'react'
import * as ReactDOM from 'react-dom'
import accounts from '../../accounts-2022.json'

type MapLike<T> = {
    [key: number]: T
};
type ReadonlyMap<T> = {
    readonly [key: number]: T
};
type AccountNumber = string | number;
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
                result[num] = 0
            }
            result[num] += t.kind === 'debit'
                ? t.amount
                : (-t.amount);
        }
    }
    return result;
}

const formatSEK = (() => {
    const intFmt = new Intl.NumberFormat('sv-SE', {
        style: 'decimal',
        useGrouping: true,
    });
    const fractionFmt = new Intl.NumberFormat('sv-SE', {
        style: 'decimal',
        useGrouping: false,
    });

    return (amount: number): string => {
        const padded = amount.toString().padStart(3, '0');
        const [int, fraction] = padded.split(/(\d{2})$/);

        const intStr = intFmt.format(parseInt(int!));
        const fractionStr = fractionFmt.format(parseInt(fraction!)).padStart(2, '0');

        return `${intStr},${fractionStr} kr`;
    };
})();

function getAccountName(account: AccountNumber): string {
    return (accounts as any)[account] ?? '';
}

type Props = {}
type State = {
    vouchers: ReadonlyArray<Voucher>
}

const App: React.FC<Props> = props => {
    const [state, setState] = React.useState<State>({
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

    return (
        <div>
            <nav className="navbar navbar-dark bg-dark">
                <div className="container">
                    <span className="navbar-brand">Leif bokföring</span>
                </div>
            </nav>

            <div className="container">
                <div className="row">
                    <div className="col-8">
                        <h4>Verifikat</h4>
                        <table className="table table-sm">
                            <tbody>
                                {state.vouchers.map((voucher, idx) => {
                                    return (
                                        <tr key={idx}>
                                            <td>{voucher.date}</td>
                                            <td>{voucher.name}</td>
                                            <td></td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="col">
                        <h4>Kontobalans</h4>
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
