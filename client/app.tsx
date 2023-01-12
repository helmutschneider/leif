import * as React from 'react'
import * as ReactDOM from 'react-dom/client'
import {
    findYearOfMostRecentlyEditedVoucher,
    tryParseInt,
    formatDate,
} from './util';
import {User, Workbook} from "./types";
import {LoginForm} from "./login-form";
import {FetchBackend, HttpBackend, LeifRequest} from "./http";
import {SettingsPage} from "./settings-page";
import {VouchersPage} from "./vouchers-page";

type Props = {
    httpBackend: HttpBackend
}
type Page =
    | 'vouchers'
    | 'settings'

type State = {
    page: Page
    search: string
    selectYearDropdownOpen: boolean
    today: string
    user: User | undefined
    workbook: Workbook | undefined
    year: number
}

const colorsForTheNavBar = [
    '#A93F55',
    '#54457F',
    '#226F54',
    '#EC9F05',
];

const SESSION_STORAGE_USER_KEY = 'user';

function tryGetUserFromSessionStorage(): User | undefined {
    const json = window.sessionStorage.getItem(SESSION_STORAGE_USER_KEY);
    let user: User | undefined;
    try {
        user = JSON.parse(json ?? '');
    } catch {}
    if (typeof user !== 'object') {
        return undefined;
    }
    return user;
}

const CONTAINER_CLASS = 'container-xxl';
const AUTHORIZATION_HEADER = 'Authorization';

function createEmptyState(): State {
    return {
        page: 'vouchers',
        search: '',
        selectYearDropdownOpen: false,
        today: formatDate(new Date(), 'yyyy-MM-dd'),
        user: undefined,
        workbook: undefined,
        year: (new Date()).getFullYear(),
    };
}

const App: React.FC<Props> = props => {
    const [state, setState] = React.useState<State>({
        ...createEmptyState(),
        user: tryGetUserFromSessionStorage(),
    });

    function logout() {
        setState(createEmptyState);
    }

    function http<T>(request: LeifRequest): PromiseLike<T> {
        const headers = {...request.headers};

        if (state.user) {
            headers[AUTHORIZATION_HEADER] = state.user.token;
        }

        return props.httpBackend.send({
            ...request,
            headers: headers,
        }).then(undefined, (err: Response) => {
            if (err.status === 401) {
                logout();
            }
            return Promise.reject(err);
        });
    }

    function reloadWorkbook() {
        http<Workbook>({
            method: 'GET',
            url: '/api/workbook',
        }).then(res => {
            const maybeYear = findYearOfMostRecentlyEditedVoucher(res);

            setState({
                ...state,
                workbook: res,

                // if the user had moved to another year we want to
                // preserve the state so we don't make them angry.
                year: maybeYear !== state.year
                    ? state.year
                    : maybeYear,
            });
        });
    }

    React.useEffect(() => {
        if (state.user) {
            window.sessionStorage.setItem(SESSION_STORAGE_USER_KEY, JSON.stringify(state.user));
            reloadWorkbook();

        } else {
            window.sessionStorage.removeItem(SESSION_STORAGE_USER_KEY);
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
                            http={http}
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
                    http={http}
                    onWorkbookChanged={reloadWorkbook}
                    search={state.search}
                    today={state.today}
                    user={state.user}
                    workbook={workbook}
                    year={state.year}
                />
            )
            break;
        case 'settings':
            viewStuff = (
                <SettingsPage
                    http={http}
                    onWorkbookChanged={reloadWorkbook}
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

    // always include the current year.
    yearsAsMap[(new Date().getFullYear())] = true;

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
                            className="form-control me-2"
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
                                <input
                                    className="form-control"
                                    onChange={event => {
                                        const dt = event.target.valueAsDate;
                                        if (!dt) {
                                            return;
                                        }
                                        setState({
                                            ...state,
                                            today: formatDate(dt, 'yyyy-MM-dd'),
                                        });
                                    }}
                                    value={state.today}
                                    title="Dagens datum"
                                    type="date"
                                />
                            </li>
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

                                        logout();
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

const el = document.getElementById('app');
const root = ReactDOM.createRoot(el!);

root.render(
    <App httpBackend={new FetchBackend()} />
);
