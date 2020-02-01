package keepo.serialization

import kotlin.reflect.KClass

class TypedDelegatingSerializer<T : Any>(val delegate: Serializer, val clazz: KClass<T>) : TypedSerializer<T> {
    override fun serialize(value: T) = delegate.serialize(value)
    override fun deserialize(value: String) = delegate.deserialize(value, clazz)
}
