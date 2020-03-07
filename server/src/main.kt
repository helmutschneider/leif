package leif

import leif.config.VariableResolver
import leif.database.JDBCDatabase
import leif.storage.GoogleCloudStorage
import leif.storage.LocalStorage
import org.sqlite.SQLiteConnection
import spark.Service
import java.nio.file.Path
import java.nio.file.Paths
import java.sql.DriverManager
import java.util.*

fun main() {
    val path = Paths.get(
        System.getProperty("leif.properties") ?: System.getProperty("user.dir").plus("/app.properties")
    )
    val file = path.toFile()
    val props = Properties()

    if (file.exists()) {
        file.inputStream().use {
            props.load(it)
        }
    }
//    val client = com.google.cloud.storage.StorageOptions.getDefaultInstance().service
//    val storage = GoogleCloudStorage(
//        client, "steffo.appspot.com"
//    )

    val storage = LocalStorage(
        Path.of(System.getProperty("user.dir"), "runtime")
    )
    val config = ApplicationConfig(
        httpPort = VariableResolver("8000") {
            environment("PORT")
            property(props, "http.port")
        }.resolve().toInt(),
        debug = true
    )
    val dbPath = Paths.get(System.getProperty("user.dir"), "runtime", "db.sqlite").toString()
    val app = Application(config, JDBCDatabase.withSQLite(dbPath))
    app.container.get<Service>()
}
