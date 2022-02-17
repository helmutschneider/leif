import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {
    findIdOfMostRecentlyEditedWorkbook, tryParseInt,
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
    activeWorkbookId: number | undefined
    search: string
    selectWorkbookDropdownOpen: boolean
    view: Page
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

const CONTAINER_CLASS = 'container-xxl';

const App: React.FC<Props> = props => {
    const [state, setState] = React.useState<State>({
        activeWorkbookId: undefined,
        search: '',
        selectWorkbookDropdownOpen: false,
        view: 'vouchers',
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
                        activeWorkbookId: findIdOfMostRecentlyEditedWorkbook(wbs),
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
        const wb = state.workbooks.find(item => {
            return typeof state.activeWorkbookId !== 'undefined'
                && state.activeWorkbookId === tryParseInt(item.workbook_id, undefined);
        })

        if (wb) {
            document.title = `Leif: ${wb.name}`;
        }
    }, [state.activeWorkbookId, state.workbooks]);

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

    const workbook = state.workbooks.find(item => {
        return typeof state.activeWorkbookId !== 'undefined'
            && state.activeWorkbookId === tryParseInt(item.workbook_id, undefined);
    });

    if (!workbook) {
        return null
    }

    const activeWorkbookIndex = state.workbooks.indexOf(workbook);
    let viewStuff: React.ReactNode = null

    switch (state.view) {
        case 'vouchers':
            viewStuff = (
                <VouchersPage
                    currency={props.currency}
                    http={props.http}
                    onChange={next => {
                        const wbs = state.workbooks.slice()
                        wbs[activeWorkbookIndex] = next;
                        setState({
                            ...state,
                            workbooks: wbs,
                        })
                    }}
                    search={state.search}
                    user={state.user}
                    workbook={workbook}
                />
            )
            break;
        case 'settings':
            viewStuff = (
                <SettingsPage
                    currency={props.currency}
                    http={props.http}
                    onChange={next => {
                        const wbs = state.workbooks.slice();
                        wbs[activeWorkbookIndex] = next;
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
                <div className={CONTAINER_CLASS}>
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
                    <div className="navbar-collapse">
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
                                                            activeWorkbookId: tryParseInt(wb.workbook_id, undefined),
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
                                            activeWorkbookId: undefined,
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
