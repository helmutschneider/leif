package keepo.database

import java.sql.Connection
import java.sql.DriverManager
import java.sql.PreparedStatement
import java.sql.ResultSet
import java.sql.Statement
import java.sql.Timestamp

class JDBCDatabase(private val connection: Connection) : Database {
    private fun <T> executePrepared(query: String, params: List<Any?>, handler: (PreparedStatement) -> T): T {
        val stmt = connection.prepareStatement(query, Statement.RETURN_GENERATED_KEYS)
        params.forEachIndexed { idx, p ->
            stmt.setObject(idx + 1, p)
        }
        stmt.execute()
        val out = handler(stmt)
        stmt.close()
        return out
    }

    private fun getColumnNamesOf(result: ResultSet): List<String> {
        return 1.rangeTo(result.metaData.columnCount).map {
            result.metaData.getColumnName(it)
        }
    }

    private fun toRow(result: ResultSet, names: List<String>): Map<String, Any?> {
        return names.map {
            var value = result.getObject(it)

            // the date & time handling in the JDBC framework is terrible.
            // it randomly converts values into the current JVM timezone
            // which is usually not what we want. instead, just return
            // the raw string value.
            if (value is Timestamp) {
                value = result.getString(it)
            }

            Pair(it, value)
        }.toMap()
    }

    override fun selectOne(query: String, params: List<Any?>): Map<String, Any?>? {
        return executePrepared(query, params) {
            val names = getColumnNamesOf(it.resultSet)
            if (it.resultSet.next()) {
                toRow(it.resultSet, names)
            } else {
                null
            }
        }
    }

    override fun select(query: String, params: List<Any?>): List<Map<String, Any?>> {
        return executePrepared(query, params) {
            val out = mutableListOf<Map<String, Any?>>()
            val names = getColumnNamesOf(it.resultSet)
            while (it.resultSet.next()) {
                out.add(toRow(it.resultSet, names))
            }
            out
        }
    }

    override fun insert(query: String, params: List<Any?>): List<Int> {
        return executePrepared(query, params) {
            val keys = it.generatedKeys
            val out = mutableListOf<Int>()
            while (keys.next()) {
                out.add(keys.getInt(1))
            }
            out
        }
    }

    override fun update(query: String, params: List<Any?>): Int {
        return executePrepared(query, params) {
            it.updateCount
        }
    }

    override fun delete(query: String, params: List<Any?>): Boolean {
        return executePrepared(query, params) {
            true
        }
    }

    override fun statement(query: String, params: List<Any?>) {
        executePrepared(query, params) {}
    }

    companion object {
        // https://dev.mysql.com/doc/connector-j/8.0/en/connector-j-reference-configuration-properties.html
        fun withMySQL(
            database: String,
            username: String,
            password: String,
            host: String = "127.0.0.1",
            port: Int = 3306
        ): JDBCDatabase {
            val args = mapOf(
                "characterEncoding" to "UTF-8",
                "connectionCollation" to "UTF-8",
                "serverTimezone" to "UTC",
                "useServerPrepStmts" to "true"
            ).map { "${it.key}=${it.value}" }.joinToString("&")

            val dsn = "jdbc:mysql://$host:$port/$database?$args"
            val conn = DriverManager.getConnection(dsn, username, password)
            return JDBCDatabase(conn)
        }
    }
}
