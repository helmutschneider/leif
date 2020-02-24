package keepo

import keepo.http.AuthFilter
import keepo.http.InitAction
import keepo.http.ListAccountingPeriodsAction
import keepo.http.ListAccountsAction
import keepo.http.ListVerificationsAction
import keepo.http.LoginAction
import keepo.validation.Rule
import spark.Service

fun main() {
    val app = Application("127.0.0.1", 8000, true)
    val http = app.container.get<Service>()

    http.get("/") { _, _ ->
        mapOf(
            "app" to "keepo",
            "version" to "1.0"
        )
    }
    http.post("/8da3cf8a0a1111ef367cb563181a175864d48cd2e95d54c9839aa1233b78eba1", InitAction(app))
    http.post("/login", LoginAction(app))
    http.before("/app/*", AuthFilter(app))
    http.get("/app/accounting-period", ListAccountingPeriodsAction(app))
    http.get("/app/accounting-period/:id/account", ListAccountsAction(app))
    http.get("/app/accounting-period/:id/verification", ListVerificationsAction(app))
    http.post("/app/accounting-period/:id/verification") { request, response ->
        app.validate(request, mapOf(
            "description" to listOf(Rule.Required, Rule.String),
            "transactions" to listOf(Rule.Required),
            "transactions.*.account_id" to listOf(Rule.Required, Rule.Integer),
            "transactions.*.amount" to listOf(Rule.Required, Rule.Integer)
        ))
        "yee"
    }
}
