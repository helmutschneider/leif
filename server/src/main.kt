package leif

import leif.async.DebounceFactory
import leif.database.DatabaseEvent
import leif.database.JDBCDatabase
import leif.database.SQLiteStorageHandler
import leif.events.Emitter
import leif.storage.GoogleCloudStorage
import leif.storage.LocalStorage
import leif.storage.Storage
import spark.Service
import java.nio.file.Path
import java.util.concurrent.Executors
import com.google.cloud.storage.StorageOptions as GoogleStorageOptions

fun main() {
    val cloudProject = System.getenv("GOOGLE_CLOUD_PROJECT")
    val storage: Storage = when {
        cloudProject is String && cloudProject.isNotEmpty() -> {
            val client = GoogleStorageOptions.getDefaultInstance().service
            GoogleCloudStorage(client, "${cloudProject}.appspot.com")
        }
        else -> {
            LocalStorage(Path.of(System.getProperty("user.dir"), "runtime"))
        }
    }
    val config = ApplicationConfig(
        httpPort = (System.getenv("PORT") ?: "8000").toInt(),
        debug = (cloudProject ?: "").isEmpty()
    )
    val emitter = Emitter<DatabaseEvent>()
    val databaseName = "db.sqlite"
    val debouncer = DebounceFactory(
        Executors.newSingleThreadScheduledExecutor()
    )
    emitter.listenAll(SQLiteStorageHandler(storage, databaseName, debouncer))

    val app = Application(config, JDBCDatabase.withSQLite(emitter, ":memory:"))
    app.container.get<Service>()
}
