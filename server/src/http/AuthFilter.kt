package keepo.http

import keepo.Application
import spark.Filter
import spark.Request
import spark.Response

class AuthFilter(val app: Application) : Filter {
    override fun handle(request: Request, response: Response) {
        val user = app.sandbox(request).user

        if (user == null) {
            throw HttpException(401, "Access denied.")
        }
    }
}
