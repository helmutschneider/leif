import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { App } from './app'
import {HttpClient, fetchBasedRequestFunction} from "@app/http";
import {SavedApplicationState} from "@app/types";
import {Login} from "@app/views/login";
import {LocalStorageHandler, StateHandler} from "@app/state";
import {WindowHistoryStateProvider} from "720-ts/src/react/Router";

declare const APP_ENV: {
    API_URL: string
    BUILD_DATE: string
}

type Props = {
    http: HttpClient
    state: StateHandler<SavedApplicationState>
}

const Index: React.FunctionComponent<Props> = props => {
    const [state, setState] = React.useState<SavedApplicationState>(
        props.state.get() ?? {schema: 1}
    )

    props.http.headers['Access-Token'] = state.identity?.token ?? ''

    React.useEffect(() => {
        props.state.set(state)
    }, [state])

    return (
        state.identity
            ? <App http={http}
                   identity={state.identity}
                   logout={() => {
                       props.state.clear()
                       setState({ schema: 1 })
                       delete props.http.headers['Access-Token']
                       window.location.href = '/'
                   }}
                   stateProvider={new WindowHistoryStateProvider()}
            />
            : <Login http={http} onLogin={identity => {
                setState({
                    ...state,
                    identity,
                })
            }} />
    )
}

const element = document.getElementById('app')
const http = new HttpClient(fetchBasedRequestFunction)
http.baseUrl = APP_ENV.API_URL

ReactDOM.render(
    <Index
        http={http}
        state={new LocalStorageHandler('APP_STORAGE', {
            identity: undefined, schema: 1
        })}
    />,
    element
)
