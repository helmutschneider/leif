package keepo.crypto

interface TokenRepository<T> {
    fun create(type: TokenType, data: T): ByteArray
    fun verify(secret: ByteArray, type: TokenType): T?
}
