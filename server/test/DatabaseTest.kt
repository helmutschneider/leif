package leif

import leif.config.VariableResolver
import leif.database.Database
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
    }

    private var internalDb: JDBCDatabase? = null

    val db: JDBCDatabase by lazy {
        internalDb?.getConnection()?.close()
        internalDb = JDBCDatabase.withSQLite(":memory:")
        loadTableSchema(internalDb!!)
        internalDb!!
    }

    fun getTableRows(table: String): List<Map<String, Any?>> {
        return db.select("SELECT * FROM $table")
    }

    private fun loadTableSchema(db: Database) {
        val schema = this.javaClass.getResourceAsStream("/sqlite.sql")
            .readAllBytes()
            .toString(Charsets.UTF_8)

        schema
            .split(";")
            .map(String::trim)
            .filter { it.isNotEmpty() }
            .forEach { db.statement(it) }
    }
}
