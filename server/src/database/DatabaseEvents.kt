package leif.database

import java.sql.Connection

sealed class DatabaseEvent {
    class Open(val connection: Connection) : DatabaseEvent()
    class Close(val connection: Connection?) : DatabaseEvent()
    class Read(val connection: Connection) : DatabaseEvent()
    class Write(val connection: Connection) : DatabaseEvent()
    class Statement(val connection: Connection) : DatabaseEvent()
}
