package leif.http

import leif.crypto.TokenRepository
import leif.crypto.TokenType
import leif.hexToByteArray
import spark.Request

class UserResolver(val repository: TokenRepository<User>) {
    fun resolve(request: Request): User? {
        return request.headers("Access-Token")
            ?.let { it.trim().hexToByteArray() }
            ?.let { repository.verify(it, TokenType.Login) }
    }
}
