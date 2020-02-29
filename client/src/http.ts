import {Map} from "720-ts/src/types"

type Request = {
    body?: object
    headers?: Map<string>
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    url: string
}

type Response<T> = {
    body: T
    headers: Map<string>
    status: number
}

export type RequestFunction = {
    <T>(request: Request): PromiseLike<Response<T>>
}

const CONTENT_TYPE_JSON = 'application/json'

export class HttpClient {
    protected readonly handler: RequestFunction

    public baseUrl: string = ''
    public headers: Map<string> = {}

    constructor(handler: RequestFunction) {
        this.handler = handler
    }

    public send<T>(request: Request): PromiseLike<Response<T>> {
        request.headers = {
            ...request.headers,
            ...this.headers,
        }

        request.url = this.baseUrl + request.url

        return this.handler(request)
    }
}

export function fetchBasedRequestFunction<T>(request: Request): PromiseLike<Response<T>> {
    const init: RequestInit = {
        headers: {
            ...(request.headers ?? {}),
            'Accept': CONTENT_TYPE_JSON,
            'Content-Type': CONTENT_TYPE_JSON,
        },
        method: request.method,
    }

    if (request.method !== 'GET') {
        init.body = JSON.stringify(request.body)
    }

    return fetch(request.url, init).then(response => {
        const promises = [
            Promise.resolve(response),
            response.json()
        ] as const

        return Promise.all(promises)
    }).then(values => {
        const [response, json] = values
        const headers: Map<string> = {}

        response.headers.forEach((value, key) => {
            headers[key] = value
        })

        const result: Response<T> = {
            body: json,
            headers: headers,
            status: response.status,
        }

        if (result.status >= 400) {
            return Promise.reject(result)
        }

        return result
    })
}
