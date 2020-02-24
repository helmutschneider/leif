package leif

import leif.http.AuthFilter
import leif.http.CreateVerificationAction
import leif.http.InitAction
import leif.http.ListAccountingPeriodsAction
import leif.http.ListAccountsAction
import leif.http.ListVerificationsAction
import leif.http.LoginAction
import spark.Service

fun main() {
    val app = Application("127.0.0.1", 8000, true)
    val http = app.container.get<Service>()

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
