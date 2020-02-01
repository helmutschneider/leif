package keepo.crypto

interface TokenStorage {
    fun get(secret: ByteArray, type: TokenType): String?
    fun put(secret: ByteArray, type: TokenType, data: String)
}
