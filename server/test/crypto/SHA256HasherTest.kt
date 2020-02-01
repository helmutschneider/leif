package keepo.crypto

import keepo.toHexString
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class SHA256HasherTest {
    val hasher = SHA256Hasher()

    @Test
    fun shouldHashCorrectly() {
        assertEquals(
            "d453b9b4c616f9899e4fa08a8f726cbcbbc1b898318b62d2c5af23098c574302",
            hasher.hash("yee".toByteArray()).toHexString()
        )
    }
}
