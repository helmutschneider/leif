package leif.container

import java.lang.reflect.ParameterizedType
import java.lang.reflect.Type
import kotlin.reflect.KClass

// Kindly borrowed from Google GSON.
// @see https://github.com/google/gson/blob/master/gson/src/main/java/com/google/gson/reflect/TypeToken.java
open class TypeToken<T> protected constructor() {
    val type = getSuperclassTypeParameter(this::class)

    override fun hashCode() = type.hashCode()
    override fun equals(other: Any?): Boolean {
        return other is TypeToken<*> &&
            other.type == this.type
    }
}

private fun getSuperclassTypeParameter(clazz: KClass<*>): Type {
    val superClazz = clazz.java.genericSuperclass

    if (superClazz !is ParameterizedType) {
        throw RuntimeException("Missing type parameter.")
    }

    return superClazz.actualTypeArguments[0]
}
