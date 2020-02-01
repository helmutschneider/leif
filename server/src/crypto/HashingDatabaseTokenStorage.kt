package keepo.crypto

import java.nio.ByteBuffer
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import keepo.database.Database

class HashingDatabaseTokenStorage(val db: Database, val hasher: Hasher<HashType.Digest>, val now: ZonedDateTime? = null) : TokenStorage {
    override fun get(secret: ByteArray, type: TokenType): String? {
        val selector = secret.slice(0 until 16).toByteArray()
        val then = this.now()
            .minusSeconds(type.expirySeconds.toLong())
            .format(DATE_FORMATTER)
        val row = db.selectOne(TOKEN_QUERY, listOf(
            selector, type.ordinal, then
        ))

        return row?.let {
            db.update("UPDATE token SET last_seen = ? WHERE token_id = ?", listOf(
                this.now().format(DATE_FORMATTER), row["token_id"]
            ))

            val data = it["data"] as String
            val hashedVerifier = it["verifier"] as ByteArray
            val bytesToVerify = buildVerifierBytes(secret, type, data)

            if (hasher.verify(bytesToVerify, hashedVerifier)) {
                data
            } else {
                null
            }
        }
    }

    override fun put(secret: ByteArray, type: TokenType, data: String) {
        val selector = secret.slice(0 until 16).toByteArray()
        val verifier = hasher.hash(buildVerifierBytes(secret, type, data))

        db.insert("INSERT INTO token(selector, verifier, type, data, last_seen) VALUES (?, ?, ?, ?, ?)", listOf(
            selector, verifier, type.ordinal, data, this.now().format(DATE_FORMATTER)
        ))
    }

    private fun buildVerifierBytes(secret: ByteArray, type: TokenType, data: String): ByteArray {
        val dataBytes = data.toByteArray()
        val verifierBytes = secret.slice(16 until 32).toByteArray()
        return ByteBuffer
            .allocate(verifierBytes.size + Byte.SIZE_BYTES + dataBytes.size)
            .put(verifierBytes)
            .put(type.ordinal.toByte())
            .put(dataBytes)
            .array()
    }

    private fun now(): ZonedDateTime {
        return (this.now ?: ZonedDateTime.now())
            .withZoneSameInstant(TIME_ZONE)
    }

    companion object {
        const val TOKEN_QUERY = """
            SELECT *
              FROM token
             WHERE selector = ?
               AND type = ?
               AND last_seen >= ?
        """
        val TIME_ZONE: ZoneId = ZoneId.of("UTC")
        val DATE_FORMATTER: DateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
    }
}
