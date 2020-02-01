package keepo.crypto

import java.time.ZoneId
import java.time.ZonedDateTime
import keepo.DatabaseTest
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test

class HashingDatabaseTokenStorageTest : DatabaseTest() {
    class NoopHasher(val hashIsValid: Boolean) : Hasher<HashType.Digest> {
        override fun hash(value: ByteArray) = value
        override fun verify(value: ByteArray, knownHash: ByteArray) = hashIsValid
    }

    @Test
    fun shouldAddRowToDatabase() {
        Assertions.assertEquals(0, getTableRows("token").size)
        val storage = HashingDatabaseTokenStorage(
            db, NoopHasher(true)
        )
        storage.put(ByteArray(32), TokenType.Login, "")
        Assertions.assertEquals(1, getTableRows("token").size)
    }

    @Test
    fun shouldFindNothingWithOtherSecret() {
        val secret = ByteArray(32)
        val storage = HashingDatabaseTokenStorage(db, NoopHasher(true))
        storage.put(secret, TokenType.Login, "")

        val other = ByteArray(32)
        other[0] = 1
        val result = storage.get(other, TokenType.Login)

        Assertions.assertNull(result)
    }

    @Test
    fun shouldTakeTypeIntoAccountWhenMatching() {
        val secret = ByteArray(32)
        val storage = HashingDatabaseTokenStorage(db, NoopHasher(true))
        storage.put(secret, TokenType.Login, "")

        val first = storage.get(secret, TokenType.Login)
        val second = storage.get(secret, TokenType.Integration)
        Assertions.assertNotNull(first)
        Assertions.assertNull(second)
    }

    @Test
    fun shouldRequireHashToBeValid() {
        val secret = ByteArray(32)
        val storage = HashingDatabaseTokenStorage(db, NoopHasher(false))
        storage.put(secret, TokenType.Login, "")
        val result = storage.get(secret, TokenType.Login)
        Assertions.assertNull(result)
    }

    @Test
    fun shouldReturnNullIfTokenIsExpired() {
        val secret = ByteArray(32)
        val hasher = NoopHasher(true)
        val zone = ZoneId.of("Europe/Stockholm")
        val dt = ZonedDateTime.of(2020, 1, 1, 0, 0, 0, 0, zone)
        var storage = HashingDatabaseTokenStorage(db, hasher, dt)
        storage.put(secret, TokenType.Login, "")

        storage = HashingDatabaseTokenStorage(db, hasher, dt.plusHours(2))

        val result = storage.get(secret, TokenType.Login)

        Assertions.assertNull(result)
    }

    @Test
    fun shouldUpdateLastSeenWhenTokenIsFetched() {
        val secret = ByteArray(32)
        val hasher = NoopHasher(true)
        val zone = ZoneId.of("Europe/Stockholm")
        val dt = ZonedDateTime.of(2020, 1, 1, 6, 0, 0, 0, zone)
        var storage = HashingDatabaseTokenStorage(db, hasher, dt)
        storage.put(secret, TokenType.Login, "")
        storage = HashingDatabaseTokenStorage(db, hasher, dt.plusMinutes(30))
        storage.get(secret, TokenType.Login)

        val rows = getTableRows("token")

        Assertions.assertEquals(1, rows.size)
        Assertions.assertEquals("2020-01-01 05:30:00", rows[0]["last_seen"])
    }
}
