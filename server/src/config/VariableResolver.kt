package leif.config

import java.util.Properties

typealias KString = String

class VariableResolver(val default: String, initialize: VariableResolver.() -> Unit = {}) {
    private val handlers = mutableListOf<() -> String?>()

    init {
        initialize(this)
    }

    fun environment(name: KString) {
        handlers.add { System.getenv(name) }
    }

    fun property(bag: Properties, name: KString) {
        handlers.add { bag.getProperty(name) }
    }

    fun resolve(): String {
        val value = handlers.fold(null as KString?) { acc, fn ->
            acc ?: fn()
        }
        return value ?: default
    }
}
