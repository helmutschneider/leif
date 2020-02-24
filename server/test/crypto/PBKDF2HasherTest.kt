package leif.crypto

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class PBKDF2HasherTest {
    val hasher = PBKDF2Hasher()

    @Test
    fun shouldGenerateHashOfSize() {
        val hash = hasher.hash("pw".toByteArray())
        assertEquals(PBKDF2Hasher.HEADER_SIZE + PBKDF2Hasher.Algorithm.PBKDF2WithHmacSHA256.hashSize, hash.size)
    }
    @Test
    fun shouldPutVersionIntoFirstByte() {
        val hash = hasher.hash("pw".toByteArray())
        assertEquals(PBKDF2Hasher.VERSION, hash[0])
    }

    @Test
    fun verifyShouldSucceedWhenPasswordIsCorrect() {
        val hash = hasher.hash("pw".toByteArray())
        assertEquals(true, hasher.verify("pw".toByteArray(), hash))
    }

    @Test
    fun verifyShouldFailWhenPasswordIsIncorrect() {
        val hash = hasher.hash("pw".toByteArray())
        assertEquals(false, hasher.verify("pws".toByteArray(), hash))
    }

    @Test
    fun shouldNotThrowWhenVerifyingWithInvalidHash() {
        val hash = byteArrayOf(1, 2, 3)
        assertEquals(false, hasher.verify("pw".toByteArray(), hash))
    }

    @Test
    fun shouldVerifyHashOfOtherAlgorithmAndRounds() {
        val other = PBKDF2Hasher(
            PBKDF2Hasher.Algorithm.PBKDF2WithHmacSHA1,
            100_000
        )

        val value = byteArrayOf(1, 2, 3)
        val hash = other.hash(value)

        assertEquals(true, hasher.verify(value, hash))
    }
}
