package leif.crypto

import leif.serialization.TypedSerializer
import kotlin.random.Random

class SerializingTokenRepository<T>(val storage: TokenStorage, val serializer: TypedSerializer<T>) : TokenRepository<T> {
    override fun create(type: TokenType, data: T): ByteArray {
        val secret = Random.nextBytes(32)
        storage.put(secret, type, serializer.serialize(data))
        return secret
    }

    override fun verify(secret: ByteArray, type: TokenType): T? {
        val result = storage.get(secret, type)
        return result?.let(serializer::deserialize)
    }
}
