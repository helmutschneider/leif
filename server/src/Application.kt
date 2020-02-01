package keepo

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.registerKotlinModule
import java.text.SimpleDateFormat
import keepo.container.Container
import keepo.crypto.HashType
import keepo.crypto.Hasher
import keepo.crypto.HashingDatabaseTokenStorage
import keepo.crypto.PBKDF2Hasher
import keepo.crypto.SHA256Hasher
import keepo.crypto.SerializingTokenRepository
import keepo.crypto.TokenRepository
import keepo.crypto.TokenStorage
import keepo.database.Database
import keepo.database.JDBCDatabase
import keepo.http.HttpException
import keepo.http.User
import keepo.serialization.JsonSerializer
import keepo.serialization.Serializer
import keepo.serialization.TypedDelegatingSerializer
import keepo.validation.Rule
import keepo.validation.Validator
import spark.Request
import spark.Service

class Application(host: String, port: Int, debug: Boolean = false) {
    val container = Container {
        singleton { this }
        singleton<Service> { container ->
            val http = Service.ignite()
                .ipAddress(host)
                .port(port)

            http.defaultResponseTransformer { value ->
                val serializer = container.get<Serializer>()
                serializer.serialize(value)
            }
            http.exception(Exception::class.java) { e, _, response ->
                val serializer = container.get<Serializer>()
                val code = if (e is HttpException) e.code else 500
                val body: Any = if (debug) e else mapOf("message" to e.message)
                response.status(code)
                response.body(serializer.serialize(body))
            }
            http.afterAfter { _, response ->
                response.header("Content-Type", "application/json")
            }
            http
        }
        singleton<Database> {
            JDBCDatabase.withMySQL("keepo", "root", "")
        }
        singleton<Serializer> {
            val mapper = ObjectMapper().registerKotlinModule()
            mapper.dateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'")
            JsonSerializer(mapper)
        }
        singleton<Hasher<HashType.Digest>> {
            SHA256Hasher()
        }
        singleton<Hasher<HashType.Password>> {
            PBKDF2Hasher()
        }
        singleton<TokenStorage> { container ->
            HashingDatabaseTokenStorage(
                container.get(),
                container.get()
            )
        }
        singleton<TokenRepository<User>> { container ->
            SerializingTokenRepository(
                container.get(),
                TypedDelegatingSerializer(
                    container.get(),
                    User::class
                )
            )
        }
    }

    fun validate(request: Request, rules: Map<String, List<Rule>>): Map<String, Any?> {
        val http = container.get<Service>()
        val serializer = container.get<Serializer>()
        val validator = Validator(rules)
        val data = serializer.deserialize(request.body(), Map::class)
        val errors = validator.validate(data)

        if (errors.isNotEmpty()) {
            http.halt(422, serializer.serialize(errors))
        }

        return data as Map<String, Any?>
    }
}
