package leif.container

class BindingBuilder {
    private val bindings = mutableMapOf<TypeToken<*>, Binding<*>>()

    fun addBinding(token: TypeToken<*>, binding: Binding<*>) {
        bindings[token] = binding
    }

    fun getBindings(): Map<TypeToken<*>, Binding<*>> = bindings

    inline fun <reified T> singleton(noinline resolver: Resolver<T>) {
        val token = object : TypeToken<T>() {}
        addBinding(token, Binding(resolver, true))
    }

    inline fun <reified T> factory(noinline resolver: Resolver<T>) {
        val token = object : TypeToken<T>() {}
        addBinding(token, Binding(resolver, false))
    }
}
