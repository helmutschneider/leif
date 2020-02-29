import * as React from 'react'
import { RequestFunction } from "@app/http";
import {Login} from "@app/login";

type Props = {
    request: RequestFunction
}

export const App: React.FunctionComponent<Props> = props => {


    React.useEffect(() => {
        props.request({
            method: 'GET',
            url: 'http://localhost:8000/'
        })
    }, [])

    return (
        <div className="container">
            <div className="row justify-content-center">
                <div className="col-lg-4">
                    <h1>Log in</h1>
                    <Login onLogin={user => {}} request={props.request} />
                </div>
            </div>
        </div>
    )
}
