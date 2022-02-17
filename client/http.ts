export type LeifRequest = {
    body?: unknown
    headers?: {[name: string]: string}
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    url: string
}

export type HttpSendFn = {
    <T>(request: LeifRequest): PromiseLike<T>
}

export type HttpBackend = {
    send: HttpSendFn
}

const JSON_CONTENT_TYPE = 'application/json';
const DEFAULT_HEADERS = {
    'Accept': JSON_CONTENT_TYPE,
    'Content-Type': JSON_CONTENT_TYPE,
};

export class FetchBackend implements HttpBackend {
    public send<T>(request: LeifRequest): PromiseLike<T> {
        return fetch(request.url, {
            method: request.method,
            headers: {
                ...DEFAULT_HEADERS,
                ...request.headers,
            },
            body: JSON.stringify(request.body),
        }).then(res => {
            if (res.status > 299) {
                return Promise.reject(res)
            }
            const contentType = res.headers.get('Content-Type');
            if (contentType?.includes(JSON_CONTENT_TYPE)) {
                return res.json()
            }
            return res.text()
        }, err => Promise.reject(err))
    }
}
