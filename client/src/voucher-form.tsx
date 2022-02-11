import * as React from 'react'
import { Voucher } from './types'
import { areDebitsAndCreditsBalanced, ensureHasEmptyTransaction, formatDate, tryParseInt } from './util'
import accounts from '../../accounts-2022.json'

type Props = {
    onChange: (next: Voucher) => unknown
    onOK: () => unknown
    voucher: Voucher
}

const accountOptions = Object.entries(accounts).map((e, idx) => {
    return (
        <option key={idx} value={e[0]}>
            {e[0]}: {e[1]}
        </option>
    )
})

export const VoucherForm: React.FC<Props> = props => {
    const isBalanced = areDebitsAndCreditsBalanced(props.voucher)

    return (
        <React.Fragment>
            <div className="mb-3">
                <label className="form-label">Namn</label>
                <input
                    className="form-control"
                    onChange={event => {
                        props.onChange({
                            ...props.voucher,
                            name: event.target.value,
                        })
                    }}
                    placeholder="Namn"
                    type="text"
                    value={props.voucher.name}
                />
            </div>
            <div className="mb-3">
                <label className="form-label">Datum</label>
                <input
                    className="form-control"
                    onChange={event => {
                        if (!event.target.valueAsDate) {
                            return
                        }
                        props.onChange({
                            ...props.voucher,
                            date: formatDate(event.target.valueAsDate, 'yyyy-MM-dd'),
                        })
                    }}
                    placeholder="Datum"
                    type="date"
                    value={props.voucher.date}
                />
            </div>
            <div className="mb-3">
                <table className="table table-sm align-middle">
                    <thead>
                        <tr>
                            <th className="col-4">Konto</th>
                            <th>Debit</th>
                            <th>Kredit</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {props.voucher.transactions.map((t, idx) => {
                            return (
                                <tr key={idx}>
                                    <td>
                                        <select
                                            className="form-control"
                                            onChange={event => {
                                                const transactions = props.voucher.transactions.slice()
                                                transactions[idx] = {
                                                    ...t,
                                                    account: event.target.value,
                                                }
                                                props.onChange({
                                                    ...props.voucher,
                                                    transactions: ensureHasEmptyTransaction(transactions),
                                                })
                                            }}
                                            value={t.account}>
                                            {accountOptions}
                                        </select>
                                    </td>
                                    <td>
                                        <input
                                            className="form-control"
                                            disabled={t.kind === 'credit' && t.amount !== 0}
                                            onChange={event => {
                                                const transactions = props.voucher.transactions.slice()
                                                transactions[idx] = {
                                                    ...t,
                                                    amount: tryParseInt(event.target.value, 0),
                                                    kind: 'debit',
                                                };
                                                props.onChange({
                                                    ...props.voucher,
                                                    transactions: ensureHasEmptyTransaction(transactions),
                                                })
                                            }}
                                            placeholder="Debit"
                                            type="text"
                                            value={t.kind === 'credit' && t.amount !== 0 ? '-' : t.amount}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            className="form-control"
                                            disabled={t.kind === 'debit' && t.amount !== 0}
                                            onChange={event => {
                                                const transactions = props.voucher.transactions.slice()
                                                transactions[idx] = {
                                                    ...t,
                                                    amount: tryParseInt(event.target.value, 0),
                                                    kind: 'credit',
                                                };
                                                props.onChange({
                                                    ...props.voucher,
                                                    transactions: ensureHasEmptyTransaction(transactions),
                                                })
                                            }}
                                            placeholder="Kredit"
                                            type="text"
                                            value={t.kind === 'debit' && t.amount !== 0 ? '-' : t.amount}
                                        />
                                    </td>
                                    <td>
                                        <i
                                            className="bi bi-x-circle-fill text-danger fs-4"
                                            onClick={event => {
                                                event.preventDefault();
                                                event.stopPropagation();
                                                const transactions = props.voucher.transactions.slice()
                                                transactions.splice(idx, 1);
                                                props.onChange({
                                                    ...props.voucher,
                                                    transactions: ensureHasEmptyTransaction(transactions),
                                                })
                                            }}
                                            role="button"
                                        />
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                <div className="d-grid">
                    <button
                        className="btn btn-success"
                        disabled={!isBalanced}
                        onClick={event => {
                            event.preventDefault()
                            event.stopPropagation()

                            props.onOK()
                        }}
                        title={isBalanced ? '' : 'Obalans'}
                    >
                        OK
                    </button>
                </div>
            </div>
        </React.Fragment>
    )
}
