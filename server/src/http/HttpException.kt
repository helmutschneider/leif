package keepo.http

class HttpException(val code: Int, message: String) : Exception(message)
