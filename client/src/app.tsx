import * as React from 'react'
import { HttpClient } from "@app/http";
import { Account, AccountingPeriod, ApplicationContext, Identity } from "@app/types";
import { Link, RedirectRoute, Route, Router, WindowHistoryStateProvider } from "720-ts/src/react/Router";
import { Verifications } from "@app/views/verifications";
import { entries } from "720-ts/src/entries";
import { AccountingPeriods } from "@app/views/accounting-periods";
import {Accounts} from "@app/views/accounts";

type Props = {
    http: HttpClient
    identity: Identity
    logout: () => unknown
}

const stateProvider = new WindowHistoryStateProvider()

type State = {
    accounts: ReadonlyArray<Account>
    accountingPeriods: ReadonlyArray<AccountingPeriod>
    currentAccountingPeriodId: number | undefined
}

const paths = {
    'Verifications': '/verifications',
    'Accounts': '/accounts',
    'Accounting periods': '/accounting-periods',
} as const

function loadAccounts(http: HttpClient, accountingPeriodId: number) {
    return http.send<ReadonlyArray<Account>>({
        method: 'GET',
        url: `/app/accounting-period/${accountingPeriodId}/account`,
    }).then(res => res.body)
}

function loadAccountingPeriods(http: HttpClient) {
    return http.send<ReadonlyArray<AccountingPeriod>>({
        method: 'GET',
        url: '/app/accounting-period',
    }).then(res => res.body)
}

export const App: React.FunctionComponent<Props> = props => {
    const [state, setState] = React.useState<State>({
        accounts: [],
        accountingPeriods: [],
        currentAccountingPeriodId: undefined,
    })

    React.useEffect(() => {
        loadAccountingPeriods(props.http).then(res => {
            setState({
                ...state,
                accountingPeriods: res,
                currentAccountingPeriodId: res[0]?.accounting_period_id
            })
        })
    }, [])

    React.useEffect(() => {
        if (!state.currentAccountingPeriodId) {
            return
        }

        loadAccounts(props.http, state.currentAccountingPeriodId).then(res => {
            setState({
                ...state,
                accounts: res,
            })
        })
    }, [state.currentAccountingPeriodId])

    return (
        <div className="flex-parent">
            <div className="flex-0">
                <nav className="navbar navbar-dark bg-dark navbar-expand">
                    <a className="navbar-brand text-green">
                        <strong>leif</strong>
                    </a>
                    <ul className="navbar-nav mr-auto">
                        {entries(paths).map((entry, idx) => {
                            return (
                                <li className="nav-item" key={idx}>
                                    <Link
                                        className="nav-link"
                                        path={entry.value}
                                        stateProvider={stateProvider}>
                                        {entry.key}
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                    <form className="form-inline">
                        <select className="form-control form-control-sm"
                                onChange={event => {
                                    setState({
                                        ...state,
                                        currentAccountingPeriodId: event.target.value
                                            ? parseInt(event.target.value)
                                            : undefined,
                                    })
                                }}
                                value={state.currentAccountingPeriodId}>
                            <option value={''}>Accounting period</option>
                            {state.accountingPeriods.map((p, i) => {
                                return (
                                    <option key={i} value={p.accounting_period_id}>{p.start} - {p.end}</option>
                                )
                            })}
                        </select>
                    </form>
                    <ul className="navbar-nav">
                        <li className="nav-item">
                            <a href="#" className="nav-link" onClick={props.logout}>
                                Logout
                            </a>
                        </li>
                    </ul>
                </nav>
            </div>
            <div className="flex-1">
                <div className="scroll-container">
                    <div className="container-fluid mt-3">
                        {
                            state.accountingPeriods.length
                                ? (
                                    <Router<ApplicationContext>
                                        context={{
                                            accounts: state.accounts,
                                            accountingPeriods: state.accountingPeriods,
                                            http: props.http,
                                            identity: props.identity
                                        }}
                                        routes={[
                                            new Route('/verifications', Verifications),
                                            new Route('/accounts', Accounts),
                                            new Route('/accounting-periods', AccountingPeriods),
                                            new RedirectRoute('/', '/verifications')
                                        ]}
                                        stateProvider={stateProvider}
                                    />
                                )
                                : 'Loading...'
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}
