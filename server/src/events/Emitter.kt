package leif.events

import leif.container.TypeToken

class Emitter<T : Any> {
    private val listeners = mutableMapOf<TypeToken<*>, MutableList<Handler<Any>>>()
    private val listenersForAllEvents = mutableListOf<Handler<T>>()

    inline fun <reified U : T> listen(noinline handler: Handler<U>) {
        val token = object : TypeToken<U>() {}
        listenWithToken(token, handler)
    }

    inline fun <reified U : T> trigger(value: U) {
        val token = object : TypeToken<U>() {}
        triggerWithToken(token, value)
    }

    fun listenAll(handler: Handler<T>) {
        listenersForAllEvents.add(handler)
    }

    fun <U : T> listenWithToken(token: TypeToken<U>, handler: Handler<U>) {
        listeners.getOrPut(token, { mutableListOf() }).add(handler as Handler<Any>)
    }

    fun <U : T> triggerWithToken(token: TypeToken<U>, value: U) {
        listeners[token]?.forEach { it(value) }
        listenersForAllEvents.forEach { it(value) }
    }
}
