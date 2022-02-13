import * as React from 'react'
import {User} from "./types";
import {HttpBackend} from "./http";

type Props = {
    http: HttpBackend
    onLogin: (user: User) => unknown
}

enum KeyCode {
    Enter = 13,
}

export const LoginForm: React.FC<Props> = props => {
    const [state, setState] = React.useState({
        username: '',
        password: '',
        isInProgress: false,
    })

    function attemptLogin(): void {
        setState({
            ...state,
            isInProgress: true,
        })

        props.http.send<User>({
            method: 'POST',
            url: '/api/login',
            body: state,
        }).then(user => {
            setState({ ...state, isInProgress: false });
            props.onLogin(user);
        }, err => {
            setState({ ...state, isInProgress: false });
            console.log(err)
        })
    }

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
                            isInProgress: false,
                        })
                    }}
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
                            isInProgress: false,
                        })
                    }}
                    type="password"
                />
            </div>
            <div className="d-grid">
                <button
                    className="btn btn-primary btn-lg"
                    disabled={state.isInProgress}
                    onClick={event => {
                        event.preventDefault()
                        event.stopPropagation()

                        attemptLogin()
                    }}
                >
                    {state.isInProgress
                        ? (
                            <span
                                className="spinner-border spinner-border-sm"
                                role="status"
                                aria-hidden="true"
                            />
                        )
                        : 'Kör'
                    }
                </button>
            </div>
        </div>
    )
}