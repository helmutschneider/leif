import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {emptyVoucher, getAccountName, formatSEK, calculateAccountBalances, ellipsis } from './util';
import * as t from './types'
import { VoucherForm } from './voucher-form';
import {User, Voucher, Workbook} from "./types";
import {LoginForm} from "./login-form";
import {FetchBackend, HttpBackend} from "./http";

type Props = {
    http: HttpBackend
}
type State = {
    search: string
    voucher: t.Voucher
    workbook: t.Workbook | undefined
    user: User | undefined
}

const SESSION_STORAGE_USER_KEY = 'user'

function tryGetUserFromSessionStorage(): User | undefined {
    const json = window.sessionStorage.getItem(SESSION_STORAGE_USER_KEY)
    let user: User | undefined
    try {
        user = JSON.parse(json ?? '')
    } catch {}
    if (typeof user !== 'object') {
        return undefined
    }
    return user
}

const App: React.FC<Props> = props => {
    const [state, setState] = React.useState<State>({
        search: '',
        voucher: emptyVoucher(),
        workbook: undefined,
        user: tryGetUserFromSessionStorage(),
    })

    React.useEffect(() => {
        if (state.user) {
            window.sessionStorage.setItem(SESSION_STORAGE_USER_KEY, JSON.stringify(state.user));
            if (props.http instanceof FetchBackend) {
                props.http.defaultHeaders['Authorization'] = state.user.token
            }

            props.http
                .send<ReadonlyArray<Workbook>>({ method: 'GET', url: '/api/workbook' })
                .then(wbs => {
                    setState({
                        ...state,
                        workbook: wbs[0]
                    })
                });
        } else {
            window.sessionStorage.removeItem(SESSION_STORAGE_USER_KEY);
            if (props.http instanceof FetchBackend) {
                delete props.http.defaultHeaders['Authorization'];
            }
        }
    }, [state.user])

    if (!state.user) {
        return (
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-lg-4">
                        <div className="text-center">
                            <img
                                className="m-3"
                                style={{ borderRadius: '50%', width: '50%' }}
                                src="/leif.jpg"
                            />
                        </div>

                        <h3>Logga in</h3>
                        <LoginForm
                            http={props.http}
                            onLogin={user => {
                                setState({
                                    ...state,
                                    user: user,
                                })
                            }}
                        />
                    </div>
                </div>
            </div>
        )
    }

    const workbook = state.workbook

    if (!workbook) {
        return null
    }

    const balances = calculateAccountBalances(workbook.vouchers);
    const filteredVouchers = state.search === ''
        ? workbook.vouchers
        : workbook.vouchers.filter(voucher => {
            const json = JSON.stringify(voucher).toLowerCase();
            return json.includes(state.search.toLowerCase())
        });

    return (
        <div>
            <nav className="navbar navbar-dark bg-dark navbar-expand-lg">
                <div className="container">
                    <div className="navbar-brand d-flex align-items-center">
                        <img
                            src="/leif.jpg"
                            style={{
                                borderRadius: 20,
                            }}
                            height={40}
                            title="Leif"
                        />
                    </div>
                    <div className="collapse navbar-collapse">
                        <input
                            className="form-control form-control-lg"
                            onChange={event => {
                                setState({
                                    ...state,
                                    search: event.target.value,
                                })
                            }}
                            placeholder={`Sök i ${workbook.name}`}
                            type="text"
                            value={state.search}
                        />
                        <ul className="navbar-nav me-auto mb-lg-0">
                            <a
                                className="nav-link text-nowrap"
                                onClick={event => {
                                    event.preventDefault()
                                    event.stopPropagation()

                                    setState({
                                        ...state,
                                        user: undefined,
                                        workbook: undefined,
                                    })
                                }}
                                href="#"
                            >
                                Logga ut
                            </a>
                        </ul>
                    </div>
                </div>
            </nav>

            <div className="container pt-3">
                <div className="row">
                    <div className="col-8">
                        <h5>Verifikat</h5>
                        <table className="table table-sm">
                            <tbody>
                                {filteredVouchers.map((voucher, idx) => {
                                    return (
                                        <tr key={idx}>
                                            <td className="col-2">{voucher.date}</td>
                                            <td className="col-8">{voucher.name}</td>
                                            <td className="col-2">
                                                {voucher.attachments.map((attachment, idx) => {
                                                    return (
                                                        <span key={idx} title={attachment.name}>
                                                            <i className="bi bi-paperclip" />
                                                        </span>
                                                    )
                                                })}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="col">
                        <div className="mb-3">
                            <h5>Lägg till verifikat</h5>
                            <VoucherForm
                                onChange={next => {
                                    setState({
                                        ...state,
                                        voucher: next,
                                    })
                                }}
                                onOK={() => {
                                    const body: Voucher = {
                                        ...state.voucher,
                                        transactions: state.voucher.transactions.filter(t => {
                                            return t.amount !== 0
                                        }),
                                        workbook_id: workbook.workbook_id!,
                                    }

                                    props.http.send<Voucher>({
                                        method: 'POST',
                                        url: '/api/voucher',
                                        body: body,
                                    }).then(res => {
                                        const next: State = {
                                            search: '',
                                            voucher: emptyVoucher(),
                                            workbook: {
                                                ...workbook,
                                                vouchers: workbook.vouchers.concat(res),
                                            },
                                            user: state.user,
                                        }
                                        setState(next)
                                    })
                                }}
                                voucher={state.voucher}
                            />
                        </div>
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

const root = document.getElementById('app');
ReactDOM.render(
    <App http={new FetchBackend()} />,
    root
);
