package leif

import leif.config.VariableResolver
import java.nio.file.Files
import java.nio.file.Path
import leif.database.JDBCDatabase
import org.junit.jupiter.api.BeforeEach

abstract class DatabaseTest {
    companion object {
        val DB_NAME = VariableResolver("leif-test") {
            environment("DB_NAME")
        }
        val DB_USERNAME = VariableResolver("root") {
            environment("DB_USERNAME")
        }
        val DB_PASSWORD = VariableResolver("") {
            environment("DB_PASSWORD")
        }

        val db by lazy {
            JDBCDatabase.withMySQL(
                DB_NAME.resolve(),
                DB_USERNAME.resolve(),
                DB_PASSWORD.resolve()
            )
        }
    }

    private fun getLoadedTableNames(): List<String> {
        val tables = db.select("""
            SELECT TABLE_NAME
              FROM information_schema.TABLES
             WHERE TABLE_SCHEMA = ?
        """.trimIndent(), listOf(DB_NAME.resolve()))

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

        val path = System.getProperty("user.dir") + "/../data/mysql.sql"

        Files.readString(Path.of(path))
            .split(";")
            .map(String::trim)
            .filter { it.isNotEmpty() }
            .forEach { db.statement(it) }

        db.statement("SET foreign_key_checks = 1")
    }
}
