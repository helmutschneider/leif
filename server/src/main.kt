package leif

import leif.config.VariableResolver
import leif.http.*
import spark.Service
import java.nio.file.Paths
import java.util.*

private val CORS_HEADERS = mapOf(
    "Access-Control-Allow-Headers" to "Accept, Content-Type, Access-Token",
    "Access-Control-Allow-Methods" to "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Origin" to "*"
)

fun main() {
    val path = Paths.get(
        System.getProperty("leif.properties") ?: System.getProperty("user.dir").plus("/app.properties")
    )
    val file = path.toFile()
    val props = Properties()

    if (file.exists()) {
        file.inputStream().use {
            props.load(it)
        }
    }

    val config = ApplicationConfig(
        httpPort = VariableResolver("8000") {
            environment("PORT")
            property(props, "http.port")
        }.resolve().toInt()
    )
    val app = Application(config)
    val http = app.container.get<Service>()

    http.get("/api") { _, _ ->
        mapOf(
            "app" to "leif",
            "version" to "1.0"
        )
    }
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
    http.post("/api/8da3cf8a0a1111ef367cb563181a175864d48cd2e95d54c9839aa1233b78eba1", InitAction(app))
    http.post("/api/login", LoginAction(app))
    http.before("/api/app/*", AuthFilter(app))
    http.get("/api/app/accounting-period", ListAccountingPeriodsAction(app))
    http.get("/api/app/accounting-period/:id/account", ListAccountsAction(app))
    http.get("/api/app/accounting-period/:id/verification", ListVerificationsAction(app))
    http.post("/api/app/accounting-period/:id/verification", CreateVerificationAction(app))

    // manual endpoints for serving static files. not the nicest way to do it
    // but I can't seem to get app engine to upload my static files.
    http.redirect.get("/", "/index.html")
    http.get("/*") { request, response ->
        val name = request.uri()
        val url = object {}::class.java.getResource(name)
        val pattern = Regex("\\.([^\\.]+)$")
        val match = pattern.find(url?.path ?: "")

        val type = when (match?.groupValues?.get(1)) {
            "css" -> "text/css"
            "html" -> "text/html"
            "js" -> "application/javascript"
            else -> null
        }

        if (type == null) {
            throw HttpException(404, "Not found")
        }

        response.header("Content-Type", type)
        response.body(url.readText())
        response
    }
}
