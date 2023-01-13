export type LeifRequest = {
    body?: unknown
    headers?: {[name: string]: string}
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    query?: {[name: string]: string}
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

function isRelativeURL(value: string): boolean {
    return !/^https?:\/\//i.test(value);
}

export class FetchBackend implements HttpBackend {
    public send<T>(request: LeifRequest): PromiseLike<T> {
        let base: string | undefined;

        if (isRelativeURL(request.url)) {
            base = window.location.origin;
        }

        const url = new URL(request.url, base);

        for (const [key, value] of Object.entries(request.query ?? {})) {
            url.searchParams.append(key, value);
        }

        return fetch(url, {
            method: request.method,
            headers: {
                ...DEFAULT_HEADERS,
                ...request.headers,
            },
            body: JSON.stringify(request.body),
        }).then(res => {
            const contentType = res.headers.get('Content-Type');
            const message = contentType?.includes(JSON_CONTENT_TYPE)
                ? res.json()
                : res.text();

            if (res.status > 299) {
                return message.then(d => Promise.reject(d));
            }

            return message;
        }, err => Promise.reject(err))
    }
}
