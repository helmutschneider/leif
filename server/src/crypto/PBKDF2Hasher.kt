package keepo.crypto

import java.nio.ByteBuffer
import java.security.MessageDigest
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec
import kotlin.random.Random

/**
 * An implementation of the Hasher interface using PBKDF2.
 * Generated hashes are using the following layout:
 * Byte:     |    0    |     1     |      2-5       | 5-20 | 21-n |
 * Contents: | version | algorithm | kdf iterations | salt | hash |
 */
class PBKDF2Hasher(val algorithm: Algorithm = Algorithm.PBKDF2WithHmacSHA256, val iterations: Int = KDF_ITERATIONS) : Hasher<HashType.Password> {
    private val factoryCache = mutableMapOf<Algorithm, SecretKeyFactory>()

    override fun hash(value: ByteArray) = hashWithSalt(
        value, algorithm, iterations, Random.nextBytes(SALT_SIZE)
    )

    override fun verify(value: ByteArray, knownHash: ByteArray): Boolean {
        if (knownHash.size < 2) {
            return false
        }

        val algo = Algorithm.values().find { it.ordinal.toByte() == knownHash[1] }

        if (algo == null) {
            return false
        }

        val expectedHashSize = HEADER_SIZE + algo.hashSize

        if (knownHash.size != expectedHashSize) {
            return false
        }

        val iterations = ByteBuffer
            .allocate(Int.SIZE_BYTES)
            .put(knownHash.slice(2 until 6).toByteArray())
            .getInt(0)

        val salt = knownHash.slice(6 until (6 + SALT_SIZE)).toByteArray()

        return MessageDigest.isEqual(knownHash, hashWithSalt(value, algo, iterations, salt))
    }

    private fun hashWithSalt(value: ByteArray, algorithm: Algorithm, iterations: Int, salt: ByteArray): ByteArray {
        val factory = factoryCache.getOrPut(algorithm) {
            SecretKeyFactory.getInstance(algorithm.name)
        }
        val chars = value.map(Byte::toChar).toCharArray()
        val spec = PBEKeySpec(chars, salt, iterations, algorithm.hashSize * 8)
        val key = factory.generateSecret(spec)

        return ByteBuffer
            .allocate(
                HEADER_SIZE + algorithm.hashSize
            )
            .put(VERSION)
            .put(algorithm.ordinal.toByte())
            .putInt(iterations)
            .put(salt)
            .put(key.encoded)
            .array()
    }

    enum class Algorithm(val hashSize: Int) {
        PBKDF2WithHmacSHA1(20),
        PBKDF2WithHmacSHA256(32),
        PBKDF2WithHmacSHA512(64),
    }

    companion object {
        const val VERSION: Byte = 1
        const val KDF_ITERATIONS = 200_000
        const val SALT_SIZE = 16
        const val HEADER_SIZE = Byte.SIZE_BYTES + Byte.SIZE_BYTES + Int.SIZE_BYTES + SALT_SIZE
    }
}
