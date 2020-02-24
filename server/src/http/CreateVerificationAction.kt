package leif.http

import leif.Application
import leif.database.Database
import leif.validation.Rule
import spark.Request
import spark.Response
import spark.Route

class CreateVerificationAction(val app: Application) : Route {
    override fun handle(request: Request, response: Response): Any? {
        val body = app.validate(request, mapOf(
            // TODO: implement date rule
            "date" to listOf(Rule.Required, Rule.String),
            "description" to listOf(Rule.Required, Rule.String),
            "transactions" to listOf(Rule.Required, Rule.Minimum(1)),

            // TODO: verify that these account ids belong to the
            // accounting period we're currently using.
            "transactions.*.account_id" to listOf(Rule.Required, Rule.Integer),
            "transactions.*.amount" to listOf(Rule.Required, Rule.Integer, Rule.SumEqual(0.0))
        ))
        val accountingPeriodId = request.params(":id")
        app.container.get<Database>().transaction { db ->
            val ids = db.insert(
                "INSERT INTO verification (date, description, accounting_period_id) VALUES (?, ?, ?)",
                listOf(body["date"], body["description"], accountingPeriodId)
            )
            val transactions = body["transactions"] as List<Map<String, Any?>>

            transactions.forEach { transaction ->
                db.insert(
                    "INSERT INTO `transaction` (amount, account_id, verification_id) VALUES (?, ?, ?)",
                    listOf(transaction["amount"], transaction["account_id"], ids.first())
                )
            }
        }

        return body
    }
}
