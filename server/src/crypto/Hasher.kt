package leif.crypto

interface Hasher<T : HashType> {
    fun hash(value: ByteArray): ByteArray
    fun verify(value: ByteArray, knownHash: ByteArray): Boolean
}
