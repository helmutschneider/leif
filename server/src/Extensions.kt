package leif

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
