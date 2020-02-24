package leif.container

import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test

class ContainerTest {
    private class X(val value: Int)

    @Test
    fun shouldResolveSingletonTypeOnce() {
        val container = Container {
            singleton { X(3) }
        }

        val x = container.get<X>()
        val y = container.get<X>()

        Assertions.assertEquals(X::class, x::class)
        Assertions.assertEquals(3, x.value)
        Assertions.assertEquals(3, y.value)
        Assertions.assertSame(x, y)
    }

    @Test
    fun shouldResolveFactoryTypeMultipleTimes() {
        val container = Container {
            factory { X(3) }
        }

        val x = container.get<X>()
        val y = container.get<X>()

        Assertions.assertNotSame(x, y)
    }

    @Test
    fun shouldInvokeFunctionWithOneArgument() {
        val container = Container {
            factory { "yee" }
        }
        val result = container.invoke { str: String ->
            str
        }
        Assertions.assertEquals("yee", result)
    }

    @Test
    fun shouldInvokeFunctionWithTwoArguments() {
        val container = Container {
            factory { "yee" }
            factory { 666.0 }
        }
        val result = container.invoke { a: Double, b: String ->
            Pair(a, b)
        }
        Assertions.assertEquals(666.0, result.first)
        Assertions.assertEquals("yee", result.second)
    }

    @Test
    fun shouldInvokeFunctionWithThreeArguments() {
        val container = Container {
            factory { "yee" }
            factory { 123 }
            factory { 666.0 }
        }
        val result = container.invoke { a: Double, b: String, c: Int ->
            Triple(a, b, c)
        }
        Assertions.assertEquals(666.0, result.first)
        Assertions.assertEquals("yee", result.second)
        Assertions.assertEquals(123, result.third)
    }
}
