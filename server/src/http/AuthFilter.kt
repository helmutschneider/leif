package keepo.http

import keepo.Application
import spark.Filter
import spark.Request
import spark.Response

class AuthFilter(val app: Application) : Filter {
    override fun handle(request: Request, response: Response) {
        val resolver = UserResolver(app.container.get())
        val user = resolver.resolve(request)

        if (user == null) {
            throw HttpException(401, "Access denied.")
        }
    }
}
