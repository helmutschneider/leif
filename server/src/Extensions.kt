package leif

import java.math.BigInteger

fun ByteArray.toHexString(): String {
    return this.joinToString("") {
        (0xFF and it.toInt()).toString(16).padStart(2, '0')
    }
}

private val HEX_PATTERN = Regex("^(?:[A-Fa-f0-9]{2})+$")

fun String.hexToByteArray(): ByteArray? {
    if (!HEX_PATTERN.matches(this)) {
        return null
    }
    return this.chunked(2)
        .map { it.toInt(16).toByte() }
        .toByteArray()
}

fun Long.Companion.parse(value: Any?): Long? {
    return when (value) {
        is Long -> value
        is Int -> value.toLong()
        is BigInteger -> value.toLong()
        is String -> value.toLongOrNull()
        else -> null
    }
}

fun Double.Companion.parse(value: Any?): Double? {
    return when (value) {
        is Double -> value
        is Int -> value.toDouble()
        is Long -> value.toDouble()
        is BigInteger -> value.toDouble()
        is String -> value.toDoubleOrNull()
        else -> null
    }
}