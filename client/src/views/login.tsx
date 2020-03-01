import * as React from 'react'
import {HttpClient} from "@app/http";
import {Identity} from "@app/types";

type Props = {
    http: HttpClient
    onLogin: (identity: Identity) => unknown
}

type State = {
    username: string
    password: string
}

function login(http: HttpClient, body: State): PromiseLike<Identity> {
    return http.send<Identity>({
        method: 'POST',
        url: '/login',
        body: body,
    }).then(res => res.body)
}

export const Login: React.FunctionComponent<Props> = props => {
    const [state, setState] = React.useState<State>({
        username: '',
        password: '',
    })

    return (
        <div className="container">
            <div className="row justify-content-center">
                <div className="col-lg-4">
                    <div className="card mt-3">
                        <div className="card-body">
                            <h3 className="card-title">Log in</h3>
                            <form onSubmit={event => {
                                event.preventDefault()
                                event.stopPropagation()

                                login(props.http, state).then(props.onLogin)
                            }}>
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
                                                username: event.target.value,
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
                                <button className="btn btn-primary btn-block">Go</button>
                            </form>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
