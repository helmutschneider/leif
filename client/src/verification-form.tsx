import * as React from 'react'
import {Verification} from "@app/types";
import {Map} from "720-ts/src/types";
import {Account} from "@app/types";
import {YSDSDate} from "720-ts/src/date";
import {entries} from "720-ts/src/entries";

type Props = {
    accounts: Map<Account>
}

export const VerificationForm: React.FunctionComponent<Props> = props => {
    const [state, setState] = React.useState<Verification>({
        date: YSDSDate.now().format('yyyy-MM-dd'),
        description: '',
        transactions: [
            {
                amount: '',
            },
            {
                amount: '',

            },
        ],
    })

    const accounts = entries(props.accounts)

    return (
        <React.Fragment>
            <div className="row">
                <div className="col-6">
                    <div className="form-group">
                        <label>Date & description</label>
                        <input className="form-control form-control-sm"
                               type="text"
                               placeholder="Date"
                               value={state.date} />
                    </div>
                    <div className="form-group">
                        <input className="form-control form-control-sm"
                               type="text"
                               placeholder="Description"
                               value={state.description} />
                    </div>
                </div>
                <div className="col-6">
                    <label>Transactions</label>
                    {state.transactions.map((t, idx) => {
                        return (
                            <div className="form-row" key={idx}>
                                <div className="col">
                                    <div className="form-group">
                                        <select className="form-control form-control-sm"
                                                onChange={event => {
                                                    if (!event.target.value) {
                                                        return
                                                    }
                                                    const st = {
                                                        ...state,
                                                        transactions: state.transactions.slice(),
                                                    }
                                                    st.transactions[idx].account_id = parseInt(event.target.value)
                                                    setState(st)
                                                }}
                                                value={t.account_id}>
                                            <option value="">Choose account</option>
                                            {accounts.map((entry, idx) => {
                                                return (
                                                    <option key={idx}
                                                            value={entry.value.account_id}>
                                                        {entry.value.number}: {entry.value.description}
                                                    </option>
                                                )
                                            })}
                                        </select>
                                    </div>
                                </div>
                                <div className="col">
                                    <div className="form-group">
                                        <input className="form-control form-control-sm"
                                               placeholder="Amount"
                                               type="text"
                                               value={t.amount} />
                                    </div>
                                </div>
                                <div className="col-1">
                                    <button className="btn btn-danger btn-sm btn-block" onClick={event => {
                                        const st = {...state}
                                        const transactions = st.transactions.slice()
                                        transactions.splice(idx, 1)
                                        st.transactions = transactions
                                        setState(st)
                                    }}>
                                        X
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                    <div className="form-group">
                        <button className="btn btn-secondary btn-sm btn-block"
                                onClick={event => {
                                    event.preventDefault()
                                    const st = {...state}
                                    st.transactions = st.transactions.concat({ amount: '' })
                                    setState(st)
                                }}>
                            Add transaction
                        </button>
                    </div>
                </div>
            </div>
            <div className="form-group">
                <button className="btn btn-success btn-sm btn-block">
                    Save
                </button>
            </div>
        </React.Fragment>
    )
}
