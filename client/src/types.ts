import * as React from 'react'
import {RouteComponentProps} from "720-ts/src/react/Router";
import {HttpClient} from "@app/http";

export type Account = {
    account_id?: number
    description: string
    number: number
}

export type AccountingPeriod = {
    accounting_period_id?: number
    end: string
    start: string
}

export type ApplicationContext = {
    accountingPeriods: ReadonlyArray<AccountingPeriod>
    http: HttpClient
    identity: Identity
}

export type ApplicationStorage = {
    identity?: Identity
    version?: number
}

export type ComponentLike<T> =
    | React.FunctionComponent<T>
    | React.ComponentClass<T>

export type Identity = {
    id: number
    username: string
    token: string
}

export type RouteComponentLike = ComponentLike<RouteComponentProps<ApplicationContext>>

export type Transaction = {
    account_id?: number
    amount: number | string
    verification_id?: number
}

export type Verification = {
    created_at?: string
    date: string
    description: string
    transactions: ReadonlyArray<Transaction>
    verification_id?: number
}
