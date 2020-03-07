package leif.storage

interface Storage {
    fun get(key: String): ByteArray?
    fun put(key: String, data: ByteArray): Unit
    fun delete(key: String): Unit
}
