import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {
    findYearOfMostRecentlyEditedVoucher,
    tryParseInt,
} from './util';
import {currencies, Currency, User, Workbook} from "./types";
import {LoginForm} from "./login-form";
import {FetchBackend, HttpBackend} from "./http";
import {SettingsPage} from "./settings-page";
import {VouchersPage} from "./vouchers-page";

type Props = {
    currency: Currency
    http: HttpBackend
}
type Page =
    | 'vouchers'
    | 'settings'

type State = {
    page: Page
    search: string
    selectYearDropdownOpen: boolean
    workbook: Workbook | undefined
    user: User | undefined
    year: number
}

const colorsForTheNavBar = [
    '#A93F55',
    '#54457F',
    '#226F54',
    '#FFB20F',
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

const CONTAINER_CLASS = 'container-xxl';

const App: React.FC<Props> = props => {
    const [state, setState] = React.useState<State>({
        search: '',
        selectYearDropdownOpen: false,
        page: 'vouchers',
        workbook: undefined,
        user: tryGetUserFromSessionStorage(),
        year: (new Date()).getFullYear(),
    })

    React.useEffect(() => {
        if (state.user) {
            window.sessionStorage.setItem(SESSION_STORAGE_USER_KEY, JSON.stringify(state.user));
            if (props.http instanceof FetchBackend) {
                props.http.defaultHeaders['Authorization'] = state.user.token
            }

            props.http.send<Workbook>({
                method: 'GET',
                url: '/api/workbook',
            }).then(res => {
                setState({
                    ...state,
                    workbook: res,
                    year: findYearOfMostRecentlyEditedVoucher(res) ?? state.year,
                });
            });
        } else {
            window.sessionStorage.removeItem(SESSION_STORAGE_USER_KEY);
            if (props.http instanceof FetchBackend) {
                delete props.http.defaultHeaders['Authorization'];
            }
        }
    }, [state.user]);

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

    const workbook = state.workbook;

    if (!workbook) {
        return null
    }

    let viewStuff: React.ReactNode = null

    switch (state.page) {
        case 'vouchers':
            viewStuff = (
                <VouchersPage
                    http={props.http}
                    onChange={next => {
                        setState({
                            ...state,
                            workbook: next,
                        })
                    }}
                    search={state.search}
                    user={state.user}
                    workbook={workbook}
                    year={state.year}
                />
            )
            break;
        case 'settings':
            viewStuff = (
                <SettingsPage
                    http={props.http}
                    onChange={next => {
                        setState({
                            ...state,
                            workbook: next,
                        })
                    }}
                    user={state.user}
                    workbook={workbook}
                />
            )
            break;
    }

    const yearsAsMap = workbook.vouchers
        .map(voucher => (new Date(voucher.date)).getFullYear())
        .reduce((carry, year) => {
            carry[year] = true;
            return carry;
        }, {} as {[key: number]: boolean});

    const years = Object.keys(yearsAsMap).map(year => tryParseInt(year, 0));
    years.sort((a, b) => {
        if (a === b) {
            return 0;
        }
        return b > a ? 1 : -1
    })

    const colorIndex = state.year % colorsForTheNavBar.length;

    return (
        <div>
            <nav
                className="navbar navbar-dark navbar-expand-lg sticky-top"
                style={{background: colorsForTheNavBar[colorIndex]}}
            >
                <div className={CONTAINER_CLASS}>
                    <div className="navbar-brand d-flex align-items-center">
                        <img
                            className="me-3"
                            src="/leif.jpg"
                            style={{
                                borderRadius: 20,
                            }}
                            height={40}
                            title="Leif"
                        />
                        {state.year}
                    </div>
                    <div className="navbar-collapse">
                        <input
                            className="form-control form-control-lg"
                            onChange={event => {
                                setState({
                                    ...state,
                                    search: event.target.value,
                                })
                            }}
                            placeholder="Sök"
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
                                            page: 'vouchers',
                                            selectYearDropdownOpen: false,
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
                                            page: 'settings',
                                            selectYearDropdownOpen: false,
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
                                            selectYearDropdownOpen: !state.selectYearDropdownOpen,
                                        })
                                    }}
                                    href="#"
                                    role="button"
                                >
                                    Välj år
                                </a>
                                <ul
                                    className="dropdown-menu"
                                    style={{ display: state.selectYearDropdownOpen ? 'block' : 'none' }}
                                >
                                    {years.map((year, index) => {
                                        return (
                                            <li key={index}>
                                                <a
                                                    className="dropdown-item"
                                                    onClick={event => {
                                                        event.preventDefault()
                                                        event.stopPropagation()

                                                        setState({
                                                            ...state,
                                                            page: 'vouchers',
                                                            selectYearDropdownOpen: false,
                                                            year: year,
                                                        })
                                                    }}
                                                    href="#">
                                                    {year}
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
                                            user: undefined,
                                            workbook: undefined,
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
            <div className={`${CONTAINER_CLASS} pt-3`}>
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
