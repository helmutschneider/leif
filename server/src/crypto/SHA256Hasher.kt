package keepo.crypto

import java.security.MessageDigest

class SHA256Hasher : Hasher<HashType.Digest> {
    override fun hash(value: ByteArray): ByteArray = instance.digest(value)
    override fun verify(value: ByteArray, knownHash: ByteArray) = MessageDigest.isEqual(knownHash, hash(value))

    companion object {
        private val instance = MessageDigest.getInstance("SHA-256")
    }
}
