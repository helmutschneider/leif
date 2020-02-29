package leif

class ApplicationConfig(initialize: ApplicationConfig.() -> Unit) {
    var debug: Boolean = false
    var httpHost: String = "127.0.0.1"
    var httpPort: Int = 8000
    var databaseHost: String = "127.0.0.1"
    var databasePort: Int = 3306
    var databaseName: String = "leif"
    var databaseUser: String = "leif"
    var databasePassword: String = "my_password"

    init {
        initialize(this)
    }
}
