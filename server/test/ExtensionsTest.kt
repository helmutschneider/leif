package leif

import org.junit.jupiter.api.Assertions
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.Arguments
import org.junit.jupiter.params.provider.MethodSource

class ExtensionsTest {
    @ParameterizedTest
    @MethodSource("parseHexProvider")
    fun shouldParseHex(value: String, expected: ByteArray?) {
        val result = value.hexToByteArray()
        Assertions.assertArrayEquals(expected, result)
    }

    companion object {
        @JvmStatic
        fun parseHexProvider(): List<Arguments> {
            return listOf(
                Arguments.of("f", null),
                Arguments.of("0f", byteArrayOf(15)),
                Arguments.of("ff", byteArrayOf(-1)),
                Arguments.of("0F", byteArrayOf(15)),
                Arguments.of("FF", byteArrayOf(-1)),
                Arguments.of("FF", byteArrayOf(-1)),
                Arguments.of("0304", byteArrayOf(3, 4)),
                Arguments.of("FF00", byteArrayOf(-1, 0))
            )
        }
    }
}
