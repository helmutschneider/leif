package keepo.http

import keepo.Application
import keepo.database.Database
import spark.Request
import spark.Response
import spark.Route

class ListVerificationsAction(val app: Application) : Route {
    override fun handle(request: Request, response: Response): Any? {
        val db = app.container.get<Database>()
        val user = app.sandbox(request).user
        val transactions = db.select("""
            SELECT t.amount,
                   t.account_id,
                   t.verification_id
              FROM `transaction` AS t
             INNER JOIN account AS a
                ON a.account_id = t.account_id
             INNER JOIN accounting_period AS ap
                ON a.accounting_period_id = ap.accounting_period_id
             WHERE ap.accounting_period_id = ?
               AND ap.organization_id = ?
        """, listOf(request.params(":id"), user?.organizationId))

        val groupedTransactions = transactions
            .groupBy { it["verification_id"] as Long }
            .map { pair ->
                Pair(pair.key, pair.value.map {
                    it.minus("verification_id")
                })
            }
            .toMap()

        val verifications = db.select("""
            SELECT v.verification_id,
                   v.date,
                   v.description
              FROM verification AS v
            INNER JOIN accounting_period AS ap
               ON ap.accounting_period_id = v.accounting_period_id
            WHERE ap.accounting_period_id = ?
              AND ap.organization_id = ?
        """, listOf(request.params(":id"), user?.organizationId))

        return verifications.map {
            it.plus(Pair("transactions", groupedTransactions[it["verification_id"]] ?: emptyList()))
        }
    }
}
