package leif

class ApplicationConfig(
    val httpHost: String = "127.0.0.1",
    val httpPort: Int = 8000,
    val databaseHost: String = "127.0.0.1",
    val databaseName: String = "leif",
    val databaseUser: String = "leif",
    val databasePassword: String = "",
    val databasePort: Int = 3306,
    val debug: Boolean = false
)
