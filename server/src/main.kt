package leif

import leif.database.DatabaseEvent
import leif.database.JDBCDatabase
import leif.events.Emitter
import leif.events.Handler
import leif.storage.GoogleCloudStorage
import leif.storage.LocalStorage
import leif.storage.Storage
import org.sqlite.SQLiteConnection
import spark.Service
import java.nio.file.Files
import java.nio.file.Path
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledFuture
import java.util.concurrent.TimeUnit
import com.google.cloud.storage.StorageOptions as GoogleStorageOptions

private fun createRestoreDatabaseListener(storage: Storage, sourceKey: String): Handler<DatabaseEvent.Open> {
    return { event ->
        val conn = event.connection
        if (conn is SQLiteConnection) {
            storage.get(sourceKey)?.let { data ->
                val db = conn.database
                val tmp = Files.createTempFile("leif-db-", "")
                val file = tmp.toFile()
                file.writeBytes(data)
                db.restore("main", file.path) { _, _ -> }
                file.delete()
                println("Restored database successfully.")
            }
        }
    }
}

private fun createPersistDatabaseListener(storage: Storage, targetKey: String): Handler<DatabaseEvent.Write> {
    val executor = Executors.newSingleThreadScheduledExecutor()
    var future: ScheduledFuture<*>? = null

    return { event ->
        val conn = event.connection
        if (conn is SQLiteConnection) {
            future?.cancel(true)
            future = executor.schedule({
                val db = conn.database
                val tmp = Files.createTempFile("leif-db-", "")
                val file = tmp.toFile()
                db.backup("main", file.path) { _, _ -> }
                storage.put(targetKey, file.readBytes())
                file.delete()
            }, 5000, TimeUnit.MILLISECONDS)
        }
    }
}

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
    emitter.listen(createRestoreDatabaseListener(storage, databaseName))
    emitter.listen(createPersistDatabaseListener(storage, databaseName))

    val app = Application(config, JDBCDatabase.withSQLite(emitter, ":memory:"))
    app.container.get<Service>()
}
