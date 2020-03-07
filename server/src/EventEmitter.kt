package leif

import leif.container.TypeToken

typealias Handler<T> = (T) -> Unit

class EventEmitter<T : Any> {
    private val listeners = mutableMapOf<TypeToken<*>, MutableList<Handler<Any>>>()

    inline fun <reified U : T> listen(noinline handler: Handler<U>) {
        val token = object : TypeToken<U>() {}
        listenWithToken(token, handler as Handler<Any>)
    }

    inline fun <reified U : T> trigger(value: U) {
        val token = object : TypeToken<U>() {}
        triggerWithToken(token, value)
    }

    fun listenWithToken(token: TypeToken<*>, handler: Handler<Any>) {
        listeners.getOrPut(token, { mutableListOf() }).add(handler)
    }

    fun triggerWithToken(token: TypeToken<*>, value: Any) {
        listeners[token]?.forEach { it(value) }
    }
}
