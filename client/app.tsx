import * as React from 'react'

export const App: React.FunctionComponent<{}> = props => {
    const [state] = React.useState({
        username: '',
        password: '',
    })

    return (
        <div className="container">
            <div className="row justify-content-center">
                <div className="col-lg-4">
                    <h1>Log in</h1>
                    <div className="form-group">
                        <label>Username</label>
                        <input type="text"
                            value={state.username}
                            className="form-control"
                            placeholder="Username" />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password"
                            value={state.password}
                            className="form-control"
                            placeholder="Password" />
                    </div>
                    <button className="btn btn-primary btn-block">Go</button>
                </div>
            </div>
        </div>
    )
}
