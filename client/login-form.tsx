import * as React from 'react'
import {BackendError, KeyCode, User} from "./types";
import {HttpSendFn} from "./http";

type Props = {
    http: HttpSendFn
    onLogin: (user: User) => unknown
}

type State = {
    username: string;
    password: string;
    isLoading: boolean;
    error: string | undefined;
}

type AlertKind = 'primary' | 'success' | 'danger';

const Alert: React.FC<{ kind: AlertKind, message: string }> = props => {
    if (!props.message) {
        return null;
    }
    return (
        <div className={`alert alert-${props.kind}`}>
            {props.message}
        </div>
    )
}

export const LoginForm: React.FC<Props> = props => {
    const [state, setState] = React.useState<State>({
        username: '',
        password: '',
        isLoading: false,
        error: undefined,
    });

    const usernameInputRef = React.useRef<HTMLInputElement>(null);

    function attemptLogin(): void {
        setState({
            ...state,
            isLoading: true,
            error: undefined,
        })

        props.http<User>({
            method: 'POST',
            url: '/api/login',
            body: state,
        }).then(user => {
            setState({ ...state, isLoading: false });
            props.onLogin(user);
        }, (err: BackendError) => {
            setState({
                ...state,
                isLoading: false,
                error: err.message,
            });
        })
    }

    React.useEffect(() => {
        usernameInputRef.current?.focus();
    }, []);

    return (
        <div
            onKeyDown={event => {
                if (event.keyCode === KeyCode.Enter) {
                    event.preventDefault()
                    event.stopPropagation()

                    attemptLogin()
                }
            }}
        >
            <div className="mb-3">
                <label className="form-label">Användarnamn</label>
                <input
                    className="form-control form-control-lg"
                    placeholder="Användarnamn"
                    onChange={event => {
                        setState({
                            username: event.target.value,
                            password: state.password,
                            isLoading: false,
                            error: undefined,
                        })
                    }}
                    ref={usernameInputRef}
                    type="text"
                />
            </div>
            <div className="mb-3">
                <label className="form-label">Lösenord</label>
                <input
                    className="form-control form-control-lg"
                    placeholder="Lösenord"
                    onChange={event => {
                        setState({
                            username: state.username,
                            password: event.target.value,
                            isLoading: false,
                            error: undefined,
                        })
                    }}
                    type="password"
                />
            </div>
            <div className="d-grid mb-3">
                <button
                    className="btn btn-primary btn-lg"
                    disabled={state.isLoading}
                    onClick={event => {
                        event.preventDefault()
                        event.stopPropagation()

                        attemptLogin()
                    }}
                >
                    {state.isLoading
                        ? (
                            <span
                                className="spinner-border spinner-border-sm"
                                role="status"
                                aria-hidden="true"
                            />
                        )
                        : 'OK'
                    }
                </button>
            </div>
            <div className="mb-3">
                <Alert kind="danger" message={state.error || ''} />
            </div>
        </div>
    )
}