export type StateHandler<T> = {
    clear(): unknown
    get(): T | undefined
    set<K extends keyof T>(value: Pick<T, K>): unknown
}

export class LocalStorageHandler<T> implements StateHandler<T> {
    protected readonly rootKey: string

    constructor(rootKey: string, initial: T) {
        this.rootKey = rootKey

        const state = this.get()

        if (typeof state === 'undefined') {
            this.set(initial)
        }
    }

    clear() {
        localStorage.clear()
    }

    get() {
        const data = localStorage.getItem(this.rootKey)
        if (typeof data !== 'string') {
            return undefined
        }
        return JSON.parse(data)
    }

    set<K extends keyof T>(value: Pick<T, K>) {
        const state = {
            ...this.get(),
            ...value,
        }
        localStorage.setItem(this.rootKey, JSON.stringify(state))
    }
}
