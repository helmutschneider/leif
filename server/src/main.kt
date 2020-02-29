package leif

import leif.http.AuthFilter
import leif.http.CreateVerificationAction
import leif.http.InitAction
import leif.http.ListAccountingPeriodsAction
import leif.http.ListAccountsAction
import leif.http.ListVerificationsAction
import leif.http.LoginAction
import spark.Service

private val CORS_HEADERS = mapOf(
    "Access-Control-Allow-Headers" to "Accept, Content-Type, Access-Token",
    "Access-Control-Allow-Methods" to "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Origin" to "*"
)

fun main() {
    val config = ApplicationConfig {
        httpHost = "127.0.0.1"
        httpPort = 8000
        debug = true
        databaseName = "leif"
        databaseUser = "root"
        databasePassword = ""
    }

    val app = Application(config)
    val http = app.container.get<Service>()

    http.get("/") { _, _ ->
        mapOf(
            "app" to "leif",
            "version" to "1.0"
        )
    }
    http.options("/*") { _, response ->
        response.status(200)
    }
    http.afterAfter { _, response ->
        CORS_HEADERS.forEach { pair ->
            response.header(pair.key, pair.value)
        }
    }
    http.post("/8da3cf8a0a1111ef367cb563181a175864d48cd2e95d54c9839aa1233b78eba1", InitAction(app))
    http.post("/login", LoginAction(app))
    http.before("/app/*", AuthFilter(app))
    http.get("/app/accounting-period", ListAccountingPeriodsAction(app))
    http.get("/app/accounting-period/:id/account", ListAccountsAction(app))
    http.get("/app/accounting-period/:id/verification", ListVerificationsAction(app))
    http.post("/app/accounting-period/:id/verification", CreateVerificationAction(app))
}
