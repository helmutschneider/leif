package leif.http

import leif.Application
import leif.crypto.HashType
import leif.crypto.Hasher
import leif.crypto.TokenRepository
import leif.crypto.TokenType
import leif.database.Database
import leif.toHexString
import leif.validation.Rule
import spark.Request
import spark.Response

class LoginAction(val app: Application) : spark.Route {
    private val tokenRepository = app.container.get<TokenRepository<User>>()

    override fun handle(request: Request, response: Response): Any? {
        val body = app.validate(request, mapOf(
            "username" to listOf(Rule.Required, Rule.String),
            "password" to listOf(Rule.Required, Rule.String)
        ))
        val db = app.container.get<Database>()
        val user = db.selectOne("SELECT * FROM user WHERE username = ?", listOf(body["username"]))

        if (user == null) {
            throw HttpException(401, "User not found")
        }

        val hasher = app.container.get<Hasher<HashType.Password>>()
        val password = (body["password"] as String).toByteArray()

        if (hasher.verify(password, user.get("password") as ByteArray)) {
            return LoginResult(
                tokenRepository.create(TokenType.Login, User(user["user_id"] as Long, user["organization_id"] as Long)).toHexString()
            )
        }

        throw HttpException(401, "Invalid password")
    }

    class LoginResult(val token: String)
}
