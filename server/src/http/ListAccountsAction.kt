package keepo.http

import keepo.Application
import keepo.database.Database
import spark.Request
import spark.Response
import spark.Route

class ListAccountsAction(val app: Application) : Route {
    override fun handle(request: Request, response: Response): Any? {
        val db = app.container.get<Database>()
        val user = app.sandbox(request).user
        return db.select("""
            SELECT account_id, number, description
              FROM account
             INNER JOIN accounting_period AS ap
                ON ap.accounting_period_id = account.accounting_period_id
             WHERE ap.accounting_period_id = ?
               AND ap.organization_id = ?
        """, listOf(request.params(":id"), user?.organizationId))
    }
}
