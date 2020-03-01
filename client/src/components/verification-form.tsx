import * as React from 'react'
import {Verification} from "@app/types";
import {Account} from "@app/types";
import {YSDSDate} from "720-ts/src/date";
import {Autocomplete} from "@app/components/autocomplete";

type Props = {
    accounts: ReadonlyArray<Account>
    save: (verification: Verification) => PromiseLike<unknown>
}

function emptyVerification(): Verification {
    return {
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
    }
}

function accountToString(account: Account): string {
    return `${account.number}: ${account.description}`
}

export const VerificationForm: React.FunctionComponent<Props> = props => {
    const [state, setState] = React.useState<Verification>(emptyVerification)

    return (
        <React.Fragment>
            <div className="form-group">
                <label>Date & description</label>
                <input className="form-control form-control-sm"
                       type="text"
                       placeholder="Date"
                       value={state.date}
                       onChange={event => {
                           setState({
                               ...state,
                               date: event.target.value,
                           })
                       }}
                />
            </div>
            <div className="form-group">
                <textarea className="form-control form-control-sm"
                       placeholder="Description"
                       value={state.description}
                       onChange={event => {
                           setState({
                               ...state,
                               description: event.target.value,
                           })
                       }}
                />
            </div>

            <label>Transactions</label>
            {state.transactions.map((t, idx) => {
                return (
                    <div className="form-row" key={idx}>
                        <div className="col-8">
                            <div className="form-group">
                                <Autocomplete
                                    onSelectItem={account => {
                                        const st = {...state}
                                        const transactions = st.transactions.slice()
                                        transactions[idx] = {
                                            ...st.transactions[idx],
                                            account_id: account.account_id,
                                        }
                                        st.transactions = transactions
                                        setState(st)
                                        return accountToString(account)
                                    }}
                                    items={props.accounts}
                                    renderItem={accountToString}
                                    placeholder="Account"
                                />
                            </div>
                        </div>
                        <div className="col-3">
                            <div className="form-group">
                                <input className="form-control form-control-sm"
                                       placeholder="Amount"
                                       type="text"
                                       value={t.amount}
                                       onChange={event => {
                                           const st = {...state}
                                           const transactions = st.transactions.slice()
                                           transactions[idx] = {
                                               ...st.transactions[idx],
                                               amount: event.target.value,
                                           }
                                           st.transactions = transactions
                                           setState(st)
                                       }}
                                />
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
            <div className="form-group">
                <button className="btn btn-success btn-sm btn-block" onClick={event => {
                    event.preventDefault()
                    props.save(state).then(() => {
                        setState(emptyVerification)
                    })
                }}>
                    Save
                </button>
            </div>
        </React.Fragment>
    )
}
