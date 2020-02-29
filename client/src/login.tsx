import * as React from 'react'
import {RequestFunction} from "@app/http";

type User = {
    id?: number
    username: string
    token: string
}

type Props = {
    onLogin: (user: User) => unknown
    request: RequestFunction
}

export const Login: React.FunctionComponent<Props> = props => {
    const [state, setState] = React.useState({
        username: '',
        password: '',
    })

    function login(): PromiseLike<User> {
        return props.request<User>({
            method: 'POST',
            url: 'http://localhost:8000/login',
            body: state,
        }).then(res => res.body)
    }

    return (
        <React.Fragment>
            <div className="form-group">
                <label>Username</label>
                <input
                    type="text"
                    value={state.username}
                    className="form-control"
                    placeholder="Username"
                    onChange={event => {
                        setState({
                            ...state,
                            username: event.target.value
                        })
                    }}
                />
            </div>
            <div className="form-group">
                <label>Password</label>
                <input type="password"
                       value={state.password}
                       className="form-control"
                       placeholder="Password"
                       onChange={event => {
                           setState({
                               ...state,
                               password: event.target.value
                           })
                       }}
                />
            </div>
            <button
                className="btn btn-primary btn-block"
                onClick={event => {
                    event.preventDefault()
                    login().then(props.onLogin)
                }}>
                Go
            </button>
        </React.Fragment>
    )
}
