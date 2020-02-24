package leif.crypto

enum class TokenType(val expirySeconds: Long) {
    Login(3600), // 1 hour
    Integration(31536000), // 1 year
}
