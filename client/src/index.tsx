import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { App } from './app'
import {HttpClient, fetchBasedRequestFunction} from "@app/http";
import {ApplicationStorage, Identity} from "@app/types";
import {Login} from "@app/login";

declare const APP_ENV: {
    API_URL: string
    BUILD_DATE: string
}

const STORAGE_KEY = 'APP_STORAGE'
const storage = window.localStorage
const element = document.getElementById('app')
const http = new HttpClient(
    fetchBasedRequestFunction
)
http.baseUrl = APP_ENV.API_URL

const appStorage = ((): ApplicationStorage => {
    const appStorage = storage.getItem(STORAGE_KEY) ?? '{}'
    return JSON.parse(appStorage)
})()

http.headers['Access-Token'] = appStorage.identity?.token ?? ''

function logout() {
    storage.clear()
    window.location.href = '/'
}

const Index: React.FunctionComponent = () => {
    const [state, setState] = React.useState<{ identity?: Identity }>({
        identity: appStorage.identity,
    })

    return (
        state.identity
            ? <App http={http} identity={state.identity} logout={logout} />
            : <Login http={http} onLogin={identity => {
                setState({ identity })
                appStorage.identity = identity
                storage.setItem(STORAGE_KEY, JSON.stringify(appStorage))
            }} />
    )
}

ReactDOM.render(
    <Index />,
    element
)
