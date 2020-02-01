package keepo

import keepo.database.Database
import keepo.http.AuthFilter
import keepo.http.InitAction
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
    http.get("/app/accounting-period") { _, _ ->
        val db = app.container.get<Database>()
        db.select("SELECT accounting_period_id, start, end FROM accounting_period")
    }
    http.get("/app/accounting-period/:id/account") { request, response ->
        val db = app.container.get<Database>()
        db.select("SELECT account_id, number, description FROM account WHERE accounting_period_id = ?", listOf(request.params(":id")))
    }
    http.get("/app/accounting-period/:id/verification") { request, _ ->
        val db = app.container.get<Database>()
        val verifications = db.select("""
            SELECT v.verification_id,
                   v.description
              FROM verification AS v
             INNER JOIN (
               SELECT verification_id
                 FROM `transaction` AS t
                INNER JOIN account AS a
                   ON a.account_id = t.account_id
                WHERE a.accounting_period_id = ?
             ) AS t1
                ON t1.verification_id = v.verification_id
        """.trimIndent(), listOf(request.params(":id")))

        verifications
    }
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
