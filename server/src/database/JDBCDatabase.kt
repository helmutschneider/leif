package leif.database

import leif.EventEmitter
import java.sql.Connection
import java.sql.DriverManager
import java.sql.PreparedStatement
import java.sql.ResultSet
import java.sql.SQLException
import java.sql.Statement
import java.sql.Timestamp

class JDBCDatabase(val events: EventEmitter<DatabaseEvent>, val resolver: () -> Connection) : Database {
    private var connection: Connection? = null

    fun getConnection(): Connection {
        if (connection == null) {
            val conn = resolver()
            events.trigger(DatabaseEvent.Open(conn))
            connection = conn
        }
        return connection!!
    }

    private fun <T> executePrepared(query: String, params: List<Any?>, handler: (PreparedStatement) -> T): T {
        var attempt = 1

        while (attempt < MAX_QUERY_ATTEMPTS) {
            try {
                val stmt = getConnection().prepareStatement(query, Statement.RETURN_GENERATED_KEYS)
                params.forEachIndexed { idx, p ->
                    stmt.setObject(idx + 1, p)
                }
                stmt.execute()
                val result = handler(stmt)
                stmt.close()
                return result
            } catch (exception: SQLException) {
                if (isExceptionCausedByLostConnection(exception) && attempt < MAX_QUERY_ATTEMPTS) {
                    connection?.close()
                    events.trigger(DatabaseEvent.Close(connection))
                    connection = null
                } else {
                    throw exception
                }
            }
            attempt += 1
        }

        throw RuntimeException("Too many query attempts.")
    }

    // kindly borrowed from https://github.com/laravel/framework/blob/6.x/src/Illuminate/Database/DetectsLostConnections.php
    private fun isExceptionCausedByLostConnection(exception: SQLException): Boolean {
        val exceptionMessage = exception.message ?: ""

        return LOST_CONNECTION_MESSAGES.any {
            exceptionMessage.contains(it)
        }
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
            events.trigger(DatabaseEvent.Read(connection!!))
            val result = it.resultSet
            val names = getColumnNamesOf(result)
            if (result.next()) {
                toRow(result, names)
            } else {
                null
            }
        }
    }

    override fun select(query: String, params: List<Any?>): List<Map<String, Any?>> {
        return executePrepared(query, params) {
            events.trigger(DatabaseEvent.Read(connection!!))
            val result = it.resultSet
            val out = mutableListOf<Map<String, Any?>>()
            val names = getColumnNamesOf(result)
            while (result.next()) {
                out.add(toRow(result, names))
            }
            out
        }
    }

    override fun insert(query: String, params: List<Any?>): List<Long> {
        return executePrepared(query, params) {
            events.trigger(DatabaseEvent.Write(connection!!))
            val keys = it.generatedKeys
            val out = mutableListOf<Long>()
            while (keys.next()) {
                out.add(keys.getLong(1))
            }
            out
        }
    }

    override fun update(query: String, params: List<Any?>): Long {
        return executePrepared(query, params) {
            events.trigger(DatabaseEvent.Write(connection!!))
            it.updateCount.toLong()
        }
    }

    override fun delete(query: String, params: List<Any?>): Boolean {
        return executePrepared(query, params) {
            events.trigger(DatabaseEvent.Write(connection!!))
            true
        }
    }

    override fun statement(query: String, params: List<Any?>) {
        executePrepared(query, params) {
            events.trigger(DatabaseEvent.Statement(connection!!))
        }
    }

    override fun <R> transaction(fn: (Database) -> R): R {
        try {
            getConnection().autoCommit = false
            val result = fn(this)
            getConnection().commit()
            return result
        } catch (exception: SQLException) {
            getConnection().rollback()
            throw exception
        } finally {
            getConnection().autoCommit = true
        }
    }

    companion object {
        const val MAX_QUERY_ATTEMPTS = 5
        val LOST_CONNECTION_MESSAGES = listOf(
            "server has gone away",
            "no connection to the server",
            "Lost connection",
            "is dead or not enabled",
            "Error while sending",
            "decryption failed or bad record mac",
            "server closed the connection unexpectedly",
            "SSL connection has been closed unexpectedly",
            "Error writing data to the connection",
            "Resource deadlock avoided",
            "Transaction() on null",
            "child connection forced to terminate due to client_idle_limit",
            "query_wait_timeout",
            "reset by peer",
            "Physical connection is not usable",
            "TCP Provider: Error code 0x68",
            "ORA-03114",
            "Packets out of order. Expected",
            "Adaptive Server connection failed",
            "Communication link failure",
            "connection is no longer usable",
            "Login timeout expired",
            "Connection refused",
            "running with the --read-only option so it cannot execute this statement",
            "No operations allowed after connection closed",
            "database connection closed"
        )

        fun withSQLite(emitter: EventEmitter<DatabaseEvent>, path: String): JDBCDatabase {
            return JDBCDatabase(emitter) {
                val conn = DriverManager.getConnection("jdbc:sqlite:${path}")
                conn.prepareStatement("PRAGMA foreign_keys = ON").use {
                    it.execute()
                }
                conn
            }
        }
    }
}
