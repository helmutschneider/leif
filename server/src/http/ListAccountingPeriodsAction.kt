package keepo.http

import keepo.Application
import keepo.database.Database
import spark.Request
import spark.Response
import spark.Route

class ListAccountingPeriodsAction(val app: Application) : Route {
    override fun handle(request: Request, response: Response): Any {
        val db = app.container.get<Database>()
        val user = app.sandbox(request).user
        return db.select("""
            SELECT accounting_period_id, start, end
              FROM accounting_period
             WHERE organization_id = ?
""", listOf(user!!.organizationId)
        )
    }
}
