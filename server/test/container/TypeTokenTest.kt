package keepo.container

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class TypeTokenTest {
    private interface X<T>
    private class Y<T>

    @Test
    fun shouldExtractTypeParameter() {
        val token = object : TypeToken<String>() {}
        assertEquals(String::class.java, token.type)
    }

    @Test
    fun shouldExtractDeepGenericType() {
        val token = object : TypeToken<X<Y<String>>>() {}
        assertEquals("keepo.container.TypeTokenTest\$X<keepo.container.TypeTokenTest\$Y<java.lang.String>>", token.type.typeName)
    }
}
