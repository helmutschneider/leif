package keepo.database

import keepo.DatabaseTest
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test

class JDBCDatabaseTest : DatabaseTest() {
    @Test
    fun shouldNotConvertTimeZonesInDateTimes() {
        db.insert("INSERT INTO organization (name, created_at) VALUES (?, ?)", listOf(
            "Yee Inc.", "2020-01-01 12:00:00"
        ))
        val rows = getTableRows("organization")

        Assertions.assertEquals("2020-01-01 12:00:00", rows[0]["created_at"])
    }

    @Test
    fun shouldAttemptToReconnectIfConnectionIsClosed() {
        db.getConnection().close()
        db.select("SELECT * FROM organization")

        Assertions.assertTrue(true)
    }
}
