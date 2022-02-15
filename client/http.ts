type LeifRequest = {
    body?: unknown
    headers?: {[name: string]: string}
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    url: string
}

export type HttpBackend = {
    send: <T>(request: LeifRequest) => PromiseLike<T>
}

export class FetchBackend implements HttpBackend {
    public defaultHeaders: {[key: string]: string} = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }

    public send<T>(request: LeifRequest): PromiseLike<T> {
        return fetch(request.url, {
            method: request.method,
            headers: {
                ...this.defaultHeaders,
                ...request.headers,
            },
            body: JSON.stringify(request.body),
        }).then(res => {
            if (res.status > 299) {
                return Promise.reject(res)
            }
            return res.json()
        }, err => Promise.reject(err))
    }
}
