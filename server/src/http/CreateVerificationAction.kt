package leif.http

import leif.Application
import leif.database.Database
import leif.database.QueryCollection
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
        val db = app.container.get<Database>()
        val queries = QueryCollection(db)
        val accountingPeriodId = request.params(":id")
        app.container.get<Database>().transaction {
            val id = queries.createVerification(
                body["date"] as String,
                body["description"] as String,
                accountingPeriodId.toLong()
            )
            val transactions = body["transactions"] as List<Map<String, Any?>>

            transactions.forEach { transaction ->
                queries.createTransaction(
                    transaction["amount"] as Long,
                    transaction["account_id"] as Long,
                    id
                )
            }
        }

        return body
    }
}
