package leif.validation

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.Arguments
import org.junit.jupiter.params.provider.Arguments.arguments
import org.junit.jupiter.params.provider.MethodSource

class DataSetTest {
    companion object {
        @JvmStatic
        fun matchingKeysProvider(): List<Arguments> {
            return listOf(
                arguments(
                    mapOf(
                        "a" to 1,
                        "b" to listOf(1, 2, 3)
                    ),
                    "*",
                    listOf("a", "b")
                ),
                arguments(
                    mapOf(
                        "a" to listOf(1, 2, 3),
                        "b" to null
                    ),
                    "a.*",
                    listOf("a.0", "a.1", "a.2")
                ),
                arguments(
                    mapOf(
                        "a" to listOf(1, 2, 3)
                    ),
                    "a.0",
                    listOf("a.0")
                ),
                arguments(
                    mapOf(
                        "a" to listOf(
                            mapOf(
                                "b" to 1,
                                "c" to 2
                            )
                        )
                    ),
                    "a.*.*",
                    listOf("a.0.b", "a.0.c")
                )
            )
        }
    }

    @ParameterizedTest
    @MethodSource("matchingKeysProvider")
    fun shouldGetMatchingKeys(data: Map<String, Any?>, ruleKey: String, expected: List<String>) {
        assertEquals(expected, DataSet(data).getMatchingKeys(ruleKey))
    }

    @Test
    fun shouldGetValueAtKey() {
        val data = DataSet(mapOf(
            "a" to mapOf(
                "b" to 1
            )
        ))

        assertEquals(1, data.getValueAtKey("a.b"))
        assertEquals(null, data.getValueAtKey("a.0"))
    }

    @Test
    fun shouldGetValueAtKeyWithList() {
        val data = DataSet(listOf(
            "a", "b", mapOf("c" to 1)
        ))

        assertEquals("a", data.getValueAtKey("0"))
        assertEquals(1, data.getValueAtKey("2.c"))
    }

    @Test
    fun shouldGetParentElementWithMap() {
        val map = mapOf(
            "a" to mapOf(
                "b" to 1
            )
        )
        val data = DataSet(map)
        assertEquals(mapOf("a.b" to 1), data.getParentElements("a.b.0"))
        assertEquals(map, data.getParentElements("a.b"))
    }

    @Test
    fun shouldGetParentElementOfRoot() {
        val list = listOf(1, 2, 3)

        assertEquals(
            mapOf(
                DataSet.ROOT_KEY to mapOf("0" to 1, "1" to 2, "2" to 3)
            ),
            DataSet(list).getParentElements("0")
        )
    }
}
