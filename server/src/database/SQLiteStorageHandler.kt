package leif.database

import leif.async.DebounceFactory
import leif.events.Handler
import leif.storage.Storage
import org.sqlite.SQLiteConnection
import org.sqlite.core.DB
import java.nio.file.Files

class SQLiteStorageHandler(
    val storage: Storage,
    val storageKey: String,
    debouncer: DebounceFactory,
    timeout: Long = 5000
) : Handler<DatabaseEvent> {
    private val persistFn = debouncer.debounce(timeout, ::persist)

    override fun invoke(event: DatabaseEvent) {
        if (event.connection !is SQLiteConnection) {
            return
        }
        when (event) {
            is DatabaseEvent.Open -> restore(event.connection.database)
            is DatabaseEvent.Write -> persistFn(event.connection.database)
        }
    }

    private fun restore(db: DB) {
        storage.get(storageKey)?.let { data ->
            val tmp = Files.createTempFile(TEMP_FILE_PREFIX, "")
            val file = tmp.toFile()
            file.writeBytes(data)
            db.restore("main", file.path) { _, _ -> }
            file.delete()
        }
    }

    private fun persist(db: DB) {
        val tmp = Files.createTempFile(TEMP_FILE_PREFIX, "")
        val file = tmp.toFile()
        db.backup("main", file.path) { _, _ -> }
        storage.put(storageKey, file.readBytes())
        file.delete()
    }

    companion object {
        const val TEMP_FILE_PREFIX = "b5c6902c-a864-4ef1-a2bd-8613c2e0a3e2"
    }
}
