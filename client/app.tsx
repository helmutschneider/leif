import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {
    emptyVoucher,
    getAccountName,
    calculateAccountBalances,
    ellipsis,
    findIndexOfMostRecentlyEditedWorkbook, tryParseInt, formatAsMonetaryAmount,
} from './util';
import * as t from './types'
import {VoucherForm} from './voucher-form';
import {currencies, Currency, User, Voucher, Workbook} from "./types";
import {LoginForm} from "./login-form";
import {FetchBackend, HttpBackend} from "./http";
import {SettingsPage} from "./settings-page";

type Props = {
    currency: Currency
    http: HttpBackend
}
type View =
    | 'vouchers'
    | 'settings'

type State = {
    activeWorkbookIndex: number
    search: string
    selectWorkbookDropdownOpen: boolean
    view: View
    voucher: t.Voucher
    workbooks: ReadonlyArray<Workbook>
    user: User | undefined
}

const colorsForTheNavBar = [
    '#A93F55',
    '#54457F',
    '#65743A',
];

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
        activeWorkbookIndex: 0,
        search: '',
        selectWorkbookDropdownOpen: false,
        view: 'vouchers',
        voucher: emptyVoucher(),
        workbooks: [],
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
                        activeWorkbookIndex: findIndexOfMostRecentlyEditedWorkbook(wbs) ?? 0,
                        workbooks: wbs,
                    });
                });
        } else {
            window.sessionStorage.removeItem(SESSION_STORAGE_USER_KEY);
            if (props.http instanceof FetchBackend) {
                delete props.http.defaultHeaders['Authorization'];
            }
        }
    }, [state.user]);

    React.useEffect(() => {
        const wb = state.workbooks[state.activeWorkbookIndex]

        if (wb) {
            document.title = `Leif: ${wb.name}`;
        }
    }, [state.activeWorkbookIndex, state.workbooks]);

    if (!state.user) {
        return (
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-lg-4">
                        <div className="text-center">
                            <img
                                className="m-3"
                                style={{ borderRadius: '50%', width: '25%' }}
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

    const workbook = state.workbooks[state.activeWorkbookIndex]

    if (!workbook) {
        return null
    }

    let viewStuff: React.ReactNode = null

    switch (state.view) {
        case 'vouchers':
            const balances = calculateAccountBalances(workbook.vouchers, workbook.balance_carry);
            let filteredVouchers: Array<t.Voucher> = state.search === ''
                ? workbook.vouchers.slice()
                : workbook.vouchers.filter(voucher => {
                    const json = JSON.stringify(voucher).toLowerCase();
                    return json.includes(state.search.toLowerCase())
                });

            const comparator = new Intl.Collator('sv', {
                numeric: true,
            })

            // sort descending by the date and creation date.
            // the date has priority.
            filteredVouchers.sort((a, b) => {
                return (comparator.compare(b.date, a.date) << 8)
                    + (comparator.compare(b.created_at, a.created_at));
            });

            viewStuff = (
                <div className="row">
                    <div className="col-8">
                        <h5>
                            Verifikat
                            {
                                state.search !== ''
                                    ? ` (${filteredVouchers.length} resultat)`
                                    : ''
                            }
                        </h5>
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
                                                    <span
                                                        key={idx}
                                                        title={attachment.name}
                                                        onClick={event => {
                                                            event.preventDefault()
                                                            event.stopPropagation()

                                                            window.open(
                                                                `/api/attachment/${attachment.attachment_id}?token=${state.user?.token}`,
                                                                '_blank'
                                                            );
                                                        }}
                                                        role="button"
                                                    >
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
                                currency={props.currency}
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
                                        const wbs = state.workbooks.slice()

                                        wbs[state.activeWorkbookIndex] = {
                                            ...workbook,
                                            vouchers: workbook.vouchers.concat(res),
                                        };

                                        const next: State = {
                                            activeWorkbookIndex: state.activeWorkbookIndex,
                                            search: '',
                                            selectWorkbookDropdownOpen: false,
                                            view: 'vouchers',
                                            voucher: emptyVoucher(),
                                            workbooks: wbs,
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
                                        <td className="text-end">{formatAsMonetaryAmount(e[1], props.currency)}</td>
                                    </tr>
                                )
                            })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )
            break;
        case 'settings':
            viewStuff = (
                <SettingsPage
                    currency={props.currency}
                    http={props.http}
                    onChange={next => {
                        const wbs = state.workbooks.slice();
                        wbs[state.activeWorkbookIndex] = next;
                        setState({
                            ...state,
                            workbooks: wbs,
                        })
                    }}
                    workbook={workbook}
                />
            )
            break;
    }

    const colorIndex = tryParseInt(workbook.workbook_id, 0) % colorsForTheNavBar.length;

    return (
        <div>
            <nav
                className="navbar navbar-dark navbar-expand-lg sticky-top"
                style={{background: colorsForTheNavBar[colorIndex]}}
            >
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
                            <li className="nav-item">
                                <a
                                    className="nav-link text-nowrap"
                                    onClick={event => {
                                        event.preventDefault()
                                        event.stopPropagation()

                                        setState({
                                            ...state,
                                            selectWorkbookDropdownOpen: false,
                                            view: 'vouchers',
                                        })
                                    }}
                                    href="#"
                                >
                                    Verifikat
                                </a>
                            </li>
                            <li className="nav-item">
                                <a
                                    className="nav-link text-nowrap"
                                    onClick={event => {
                                        event.preventDefault()
                                        event.stopPropagation()

                                        setState({
                                            ...state,
                                            selectWorkbookDropdownOpen: false,
                                            view: 'settings',
                                        })
                                    }}
                                    href="#"
                                >
                                    Inställningar
                                </a>
                            </li>
                            <li className="nav-item dropdown">
                                <a
                                    className="nav-link dropdown-toggle"
                                    onClick={event => {
                                        event.preventDefault()
                                        event.stopPropagation()

                                        setState({
                                            ...state,
                                            selectWorkbookDropdownOpen: !state.selectWorkbookDropdownOpen,
                                        })
                                    }}
                                    href="#"
                                    role="button"
                                >
                                    Välj arbetsbok
                                </a>
                                <ul
                                    className="dropdown-menu"
                                    style={{ display: state.selectWorkbookDropdownOpen ? 'block' : 'none' }}
                                >
                                    {state.workbooks.map((wb, index) => {
                                        return (
                                            <li key={index}>
                                                <a
                                                    className="dropdown-item"
                                                    onClick={event => {
                                                        event.preventDefault()
                                                        event.stopPropagation()

                                                        setState({
                                                            ...state,
                                                            activeWorkbookIndex: index,
                                                            selectWorkbookDropdownOpen: false,
                                                        })
                                                    }}
                                                    href="#">
                                                    {wb.name}
                                                </a>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </li>
                            <li className="nav-item">
                                <a
                                    className="nav-link text-nowrap"
                                    onClick={event => {
                                        event.preventDefault()
                                        event.stopPropagation()

                                        setState({
                                            ...state,
                                            activeWorkbookIndex: 0,
                                            user: undefined,
                                            workbooks: [],
                                        })
                                    }}
                                    href="#"
                                >
                                    Logga ut
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
            <div className="container pt-3">
                {viewStuff}
            </div>
        </div>
    )
}

const root = document.getElementById('app');
ReactDOM.render(
    <App
        currency={currencies.SEK}
        http={new FetchBackend()}
    />,
    root
);
