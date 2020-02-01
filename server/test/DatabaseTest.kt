package keepo

import java.nio.file.Files
import java.nio.file.Path
import keepo.database.JDBCDatabase
import org.junit.jupiter.api.BeforeEach

abstract class DatabaseTest {
    companion object {
        const val DB_NAME = "keepo-test"
        const val DB_USERNAME = "root"
        const val DB_PASSWORD = ""

        val db by lazy {
            JDBCDatabase.withMySQL(DB_NAME, DB_USERNAME, DB_PASSWORD)
        }
    }

    private fun getLoadedTableNames(): List<String> {
        val tables = db.select("""
            SELECT TABLE_NAME
              FROM information_schema.TABLES
             WHERE TABLE_SCHEMA = ?
        """.trimIndent(), listOf(DB_NAME))

        return tables.map { it["TABLE_NAME"] as String }
    }

    fun getTableRows(table: String): List<Map<String, Any?>> {
        return db.select("SELECT * FROM $table")
    }

    @BeforeEach
    fun loadTableSchema() {
        db.statement("SET foreign_key_checks = 0")

        getLoadedTableNames().map {
            db.statement("DROP TABLE IF EXISTS `$it`")
        }

        val path = System.getProperty("user.dir") + "/data/mysql.sql"

        Files.readString(Path.of(path))
            .split(";")
            .map(String::trim)
            .filter { it.isNotEmpty() }
            .forEach { db.statement(it) }

        db.statement("SET foreign_key_checks = 1")
    }
}
