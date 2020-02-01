package keepo.serialization

import com.fasterxml.jackson.core.JsonProcessingException
import com.fasterxml.jackson.databind.ObjectMapper
import kotlin.reflect.KClass

class JsonSerializer(val mapper: ObjectMapper) : Serializer {
    override fun serialize(value: Any?): String = mapper.writeValueAsString(value)
    override fun <T : Any> deserialize(value: String, clazz: KClass<T>): T? {
        return try {
            mapper.readValue(value, clazz.java)
        } catch (e: JsonProcessingException) {
            null
        }
    }
}
