package leif.database

import leif.async.DebounceFactory
import leif.events.Emitter
import leif.storage.Storage
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.nio.file.Files
import java.nio.file.Path
import java.sql.Connection
import java.sql.DriverManager
import java.util.concurrent.Executors

class SQLiteStorageHandlerTest {
    var backupDatabase: Connection? = null
    val pathToBackupDatabase: Path = Files.createTempFile("9cf20f19-6efc-489e-bb80-9c0d901bef9b", "")

    @BeforeEach
    fun setUp() {
        backupDatabase = DriverManager.getConnection("jdbc:sqlite:${pathToBackupDatabase}")
        backupDatabase?.prepareStatement("CREATE TABLE car (car_id INTEGER PRIMARY KEY NOT NULL, make TEXT NOT NULL)").use {
            it?.execute()
        }
        backupDatabase?.prepareStatement("INSERT INTO car (make) VALUES (?)")?.use {
            it.setString(1, "Toyota")
            it.execute()
            it.setString(1, "Tesla")
            it.execute()
        }
    }

    @AfterEach
    fun tearDown() {
        backupDatabase?.close()
        backupDatabase = null
        pathToBackupDatabase.toFile().delete()
    }

    @Test
    fun shouldRestoreDatabaseFromStorage() {
        var didGetFromStorage = false
        val storage = object : Storage {
            override fun get(key: String): ByteArray? {
                didGetFromStorage = true
                return pathToBackupDatabase.toFile().readBytes()
            }
            override fun put(key: String, data: ByteArray) { }
            override fun delete(key: String) { }
        }

        val db = DriverManager.getConnection("jdbc:sqlite::memory:")
        val debouncer = DebounceFactory(
            Executors.newSingleThreadScheduledExecutor()
        )
        val handler = SQLiteStorageHandler(storage, "", debouncer, 0)
        handler(DatabaseEvent.Open(db))

        Thread.sleep(100)

        val wrapped = JDBCDatabase(Emitter()) { db }
        val rows = wrapped.select("SELECT * FROM car")

        Assertions.assertEquals(true, didGetFromStorage)
        Assertions.assertEquals(2, rows.size)
        Assertions.assertEquals("Toyota", rows[0]["make"])
        Assertions.assertEquals("Tesla", rows[1]["make"])
    }

    @Test
    fun shouldPersistDatabaseToStorage() {
        var didPutInStorage = false
        val storage = object : Storage {
            override fun get(key: String): ByteArray? {
                return null
            }
            override fun put(key: String, data: ByteArray) {
                didPutInStorage = true
            }
            override fun delete(key: String) { }
        }

        val db = DriverManager.getConnection("jdbc:sqlite::memory:")
        val debouncer = DebounceFactory(
            Executors.newSingleThreadScheduledExecutor()
        )
        val handler = SQLiteStorageHandler(storage, "", debouncer, 0)
        handler(DatabaseEvent.Write(db))

        Thread.sleep(100)

        Assertions.assertEquals(true, didPutInStorage)
    }
}