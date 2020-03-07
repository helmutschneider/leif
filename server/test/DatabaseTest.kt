package leif

import leif.database.Database
import leif.database.JDBCDatabase

private fun loadTableSchema(db: Database) {
    val schema = object {}.javaClass.getResourceAsStream("/sqlite.sql")
        .readAllBytes()
        .toString(Charsets.UTF_8)

    schema
        .split(";")
        .map(String::trim)
        .filter { it.isNotEmpty() }
        .forEach { db.statement(it) }
}

abstract class DatabaseTest {
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
}
