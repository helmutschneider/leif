package leif.container

class Container(init: BindingBuilder.() -> Unit) {
    private val bindings: Map<TypeToken<*>, Binding<*>>
    private val singletons = mutableMapOf<TypeToken<*>, Any?>()

    init {
        val builder = BindingBuilder()
        init(builder)
        this.bindings = builder.getBindings()
    }

    inline fun <reified T> get(): T {
        val token = object : TypeToken<T>() {}
        return getByTypeToken(token)
    }

    inline fun <reified A, R> invoke(fn: (A) -> R): R {
        return fn(get())
    }

    inline fun <reified A, reified B, R> invoke(fn: (A, B) -> R): R {
        return fn(get(), get())
    }

    inline fun <reified A, reified B, reified C, R> invoke(fn: (A, B, C) -> R): R {
        return fn(get(), get(), get())
    }

    fun <T> getByTypeToken(token: TypeToken<T>): T {
        val typeName = token.type.typeName
        val binding = this.bindings[token] ?: throw Exception("Binding for $typeName does not exist")

        if (binding.isSingleton && singletons.containsKey(token)) {
            return singletons[token] as T
        }

        val resolved = binding.resolver.invoke(this)

        if (binding.isSingleton) {
            singletons[token] = resolved
        }

        return resolved as T
    }
}
