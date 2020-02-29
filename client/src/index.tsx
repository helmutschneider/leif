import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { App } from './app'
import {request} from "@app/http";

const element = document.getElementById('app')

ReactDOM.render(
    <App request={request} />,
    element
)
