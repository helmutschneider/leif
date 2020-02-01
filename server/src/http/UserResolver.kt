package keepo.http

import keepo.crypto.TokenRepository
import keepo.crypto.TokenType
import keepo.hexToByteArray
import spark.Request

class UserResolver(val repository: TokenRepository<User>) {
    fun resolve(request: Request): User? {
        return request.headers("Access-Token")
            ?.let { it.trim().hexToByteArray() }
            ?.let { repository.verify(it, TokenType.Login) }
    }
}
