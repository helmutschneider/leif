package leif

import java.nio.file.Files
import java.nio.file.Path
import java.util.Properties

class ApplicationConfig(
    val httpHost: String,
    val httpPort: Int,
    val databaseHost: String,
    val databaseName: String,
    val databaseUser: String,
    val databasePassword: String,
    val databasePort: Int = 3306,
    val debug: Boolean = false
) {
    companion object {
        fun fromPropertiesFile(path: Path): ApplicationConfig {
            val reader = Files.newBufferedReader(path)
            val properties = Properties()
            properties.load(reader)
            reader.close()

            return ApplicationConfig(
                httpHost = properties.getProperty("http.host"),
                httpPort = properties.getProperty("http.port").toInt(),
                databaseHost = properties.getProperty("database.host"),
                databaseName = properties.getProperty("database.name"),
                databaseUser = properties.getProperty("database.user"),
                databasePassword = properties.getProperty("database.password"),
                databasePort = properties.getProperty("database.port").toInt(),
                debug = properties.getProperty("debug")?.toBoolean() ?: false
            )
        }
    }
}
