package leif.database

import java.sql.Connection

sealed class DatabaseEvent(val connection: Connection) {
    class Open(connection: Connection) : DatabaseEvent(connection)
    class Close(connection: Connection) : DatabaseEvent(connection)
    class Read(connection: Connection) : DatabaseEvent(connection)
    class Write(connection: Connection) : DatabaseEvent(connection)
    class Statement(connection: Connection) : DatabaseEvent(connection)
}
