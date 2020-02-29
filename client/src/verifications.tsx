import * as React from 'react'
import {Account, RouteComponentLike, Verification} from "@app/types";
import {Map} from "720-ts/src/types";
import {keyBy} from "720-ts/src/keyBy";
import {VerificationForm} from "@app/verification-form";

export const Verifications: RouteComponentLike = props => {
    const [state, setState] = React.useState({
        accounts: {} as Map<Account>,
        currentAccountingPeriod: props.context.accountingPeriods[0]?.accounting_period_id,
        isCreateFormOpen: false,
        verifications: [] as ReadonlyArray<Verification>,
    })

    function loadAccounts(accountingPeriodId: number): PromiseLike<unknown> {
        return props.context.http.send<ReadonlyArray<Account>>({
            method: 'GET',
            url: `/app/accounting-period/${accountingPeriodId}/account`,
        }).then(res => {
            setState({
                accounts: keyBy(res.body, item => item.account_id?.toString() ?? ''),
                currentAccountingPeriod: accountingPeriodId,
                isCreateFormOpen: false,
                verifications: state.verifications,
            })
            return accountingPeriodId
        })
    }

    function loadVerifications(accountingPeriodId: number): PromiseLike<unknown> {
        return props.context.http.send<ReadonlyArray<Verification>>({
            method: 'GET',
            url: `/app/accounting-period/${accountingPeriodId}/verification`,
        }).then(res => {
            setState({
                accounts: {},
                currentAccountingPeriod: accountingPeriodId,
                isCreateFormOpen: false,
                verifications: res.body,
            })
            return accountingPeriodId
        }).then(loadAccounts)
    }

    React.useEffect(() => {
        if (!state.currentAccountingPeriod) {
            return
        }
        loadVerifications(state.currentAccountingPeriod)
    }, [state.currentAccountingPeriod])

    return (
        <div>
            <div className="row">
                <div className="col-8">
                    <div className="form-group">
                        <label>Choose accounting period</label>
                        <select className="form-control form-control-sm"
                                onChange={event => {
                                    setState({
                                        ...state,
                                        currentAccountingPeriod: event.target.value
                                            ? parseInt(event.target.value)
                                            : undefined,
                                    })
                                }}
                                value={state.currentAccountingPeriod}>
                            <option value={''}>Choose value</option>
                            {props.context.accountingPeriods.map((p, i) => {
                                return (
                                    <option key={i} value={p.accounting_period_id}>{p.start} - {p.end}</option>
                                )
                            })}
                        </select>
                    </div>
                </div>
                <div className="col-4">
                    <div className="form-group">
                        <label>&nbsp;</label>
                        <button className="btn btn-primary btn-block" onClick={event => {
                            event.preventDefault()

                            setState({
                                ...state,
                                isCreateFormOpen: !state.isCreateFormOpen,
                            })
                        }}>
                            Create verification
                        </button>
                    </div>
                </div>
            </div>

            {state.isCreateFormOpen
                ? <VerificationForm accounts={state.accounts} />
                : undefined
            }

            <table className="table table-sm mt-3">
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Date</th>
                    <th>Description</th>
                </tr>
                </thead>
                <tbody>
                {state.verifications.map((v, idx) => {
                    return (
                        <tr key={idx}>
                            <td>{v.verification_id}</td>
                            <td>{v.date}</td>
                            <td>{v.description}</td>
                        </tr>
                    )
                })}
                </tbody>
            </table>
        </div>
    )
}
