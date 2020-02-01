package keepo.serialization

interface TypedSerializer<T> {
    fun serialize(value: T): String
    fun deserialize(value: String): T?
}
