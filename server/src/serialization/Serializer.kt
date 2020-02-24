package leif.serialization

import kotlin.reflect.KClass

interface Serializer {
    fun serialize(value: Any?): String
    fun <T : Any> deserialize(value: String, clazz: KClass<T>): T?
}
