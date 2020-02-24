package leif.crypto

import leif.serialization.TypedSerializer
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

class SerializingTokenRepositoryTest {
    private val memoryStorage = object : TokenStorage {
        val data = mutableMapOf<Pair<ByteArray, TokenType>, String>()

        override fun get(secret: ByteArray, type: TokenType): String? {
            return data[Pair(secret, type)]
        }
        override fun put(secret: ByteArray, type: TokenType, data: String) {
            this.data[Pair(secret, type)] = data
        }
    }
    private val stringSerializer = object : TypedSerializer<String> {
        override fun serialize(value: String) = value.repeat(2)
        override fun deserialize(value: String) = value.substring(0, value.length / 2)
    }

    @BeforeEach
    fun setUp() {
        memoryStorage.data.clear()
    }

    @Test
    fun testGeneratesSecretOfCorrectSize() {
        val repo = SerializingTokenRepository(memoryStorage, stringSerializer)
        val secret = repo.create(TokenType.Login, "yee")
        Assertions.assertEquals(32, secret.size)
    }

    @Test
    fun testPutsDataIntoStorage() {
        val repo = SerializingTokenRepository(memoryStorage, stringSerializer)
        val secret = repo.create(TokenType.Login, "yee")
        Assertions.assertEquals(true, memoryStorage.data.containsKey(Pair(secret, TokenType.Login)))
    }

    @Test
    fun testSerializesDataIntoStorage() {
        val repo = SerializingTokenRepository(memoryStorage, stringSerializer)
        repo.create(TokenType.Login, "yee")
        Assertions.assertEquals(true, memoryStorage.data.containsValue("yeeyee"))
    }

    @Test
    fun testDeserializesDataWhenVerifying() {
        val repo = SerializingTokenRepository(memoryStorage, stringSerializer)
        val secret = repo.create(TokenType.Login, "yee")
        Assertions.assertEquals("yee", repo.verify(secret, TokenType.Login))
    }
}
