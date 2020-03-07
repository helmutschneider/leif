package leif

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.registerKotlinModule
import java.text.SimpleDateFormat
import leif.container.Container
import leif.crypto.HashType
import leif.crypto.Hasher
import leif.crypto.HashingDatabaseTokenStorage
import leif.crypto.PBKDF2Hasher
import leif.crypto.SHA256Hasher
import leif.crypto.SerializingTokenRepository
import leif.crypto.TokenRepository
import leif.crypto.TokenStorage
import leif.database.Database
import leif.database.JDBCDatabase
import leif.http.*
import leif.serialization.JsonSerializer
import leif.serialization.Serializer
import leif.serialization.TypedDelegatingSerializer
import leif.validation.RuleLike
import leif.validation.Validator
import spark.Request
import spark.Response
import spark.Service

private val CORS_HEADERS = mapOf(
    "Access-Control-Allow-Headers" to "Accept, Content-Type, Access-Token",
    "Access-Control-Allow-Methods" to "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Origin" to "*"
)

class Application(val config: ApplicationConfig) {
    val app = this
    val container = Container {
        singleton { this }
        singleton<Service> { container ->
            val http = Service.ignite()
                .ipAddress(config.httpHost)
                .port(config.httpPort)

            http.defaultResponseTransformer { value ->
                when (value) {
                    is Response -> value.body()
                    else -> {
                        val serializer = container.get<Serializer>()
                        serializer.serialize(value)
                    }
                }
            }
            http.exception(Exception::class.java) { e, _, response ->
                val serializer = container.get<Serializer>()
                val code = if (e is HttpException) e.code else 500
                val body: Any = if (config.debug) e else mapOf("message" to e.message)
                response.status(code)
                response.body(serializer.serialize(body))
            }
            http.staticFiles.location("/public")
            http.before("/*") { request, response ->
                if (request.requestMethod() == "OPTIONS") {
                    http.halt(200)
                }
            }
            http.afterAfter { _, response ->
                CORS_HEADERS.forEach { pair ->
                    response.header(pair.key, pair.value)
                }
            }
            http.path("/api") {
                http.get("/") { _, _ ->
                    mapOf(
                        "app" to "leif",
                        "version" to "1.0"
                    )
                }
                http.post("/8da3cf8a0a1111ef367cb563181a175864d48cd2e95d54c9839aa1233b78eba1", InitAction(app))
                http.post("/login", LoginAction(app))
                http.before("/app/*", AuthFilter(app))
                http.get("/app/accounting-period", ListAccountingPeriodsAction(app))
                http.get("/app/accounting-period/:id/account", ListAccountsAction(app))
                http.get("/app/accounting-period/:id/verification", ListVerificationsAction(app))
                http.post("/app/accounting-period/:id/verification", CreateVerificationAction(app))
            }
            http.afterAfter("/api") { _, response ->
                response.header("Content-Type", "application/json")
            }
            http
        }
        singleton<Database> {
            JDBCDatabase.withMySQL(
                config.databaseName,
                config.databaseUser,
                config.databasePassword,
                config.databaseHost,
                config.databasePort
            )
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

    fun sandbox(request: Request): RequestSandbox {
        val name = RequestSandbox::class.qualifiedName
        var box = request.attribute<RequestSandbox?>(name)

        if (box == null) {
            val resolver = UserResolver(container.get())
            val user = resolver.resolve(request)
            box = RequestSandbox(user)
            request.attribute(name, box)
        }

        return box
    }

    fun validate(request: Request, rules: Map<String, List<RuleLike>>): Map<String, Any?> {
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
