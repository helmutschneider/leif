import * as React from 'react'
import {HttpClient} from "@app/http";
import {AccountingPeriod, ApplicationContext, Identity} from "@app/types";
import {Link, RedirectRoute, Route, Router, WindowHistoryStateProvider} from "720-ts/src/react/Router";
import {Verifications} from "@app/verifications";
import {entries} from "720-ts/src/entries";
import {AccountingPeriods} from "@app/accounting-periods";

type Props = {
    http: HttpClient
    identity: Identity
    logout: () => unknown
}

const stateProvider = new WindowHistoryStateProvider()

type State = {
    accountingPeriods: ReadonlyArray<AccountingPeriod>
}

const paths = {
    'Verifications': '/verifications',
    'Accounting periods': '/accounting-periods',
} as const

export const App: React.FunctionComponent<Props> = props => {
    const [state, setState] = React.useState<State>({
        accountingPeriods: [],
    })

    React.useEffect(() => {
        props.http.send<ReadonlyArray<AccountingPeriod>>({
            method: 'GET',
            url: '/app/accounting-period',
        }).then(res => {
            setState({
                accountingPeriods: res.body,
            })
        })
    }, [])

    return (
        state.accountingPeriods.length
            ? (
                <React.Fragment>
                    <nav className="navbar navbar-dark bg-dark navbar-expand">
                        <div className="container">
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
                            <ul className="navbar-nav">
                                <li className="nav-item">
                                    <a href="#" className="nav-link" onClick={props.logout}>
                                        Logout
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </nav>
                    <div className="container mt-3">
                        <Router<ApplicationContext>
                            context={{
                                accountingPeriods: state.accountingPeriods,
                                http: props.http,
                                identity: props.identity
                            }}
                            routes={[
                                new Route('/verifications', Verifications),
                                new Route('/accounting-periods', AccountingPeriods),
                                new RedirectRoute('/', '/verifications')
                            ]}
                            stateProvider={stateProvider}
                        />
                    </div>
                </React.Fragment>
            )
            : <div>Loading...</div>
    )
}
