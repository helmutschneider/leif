package leif.config

import org.junit.jupiter.api.Assertions
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.Arguments
import org.junit.jupiter.params.provider.MethodSource
import java.util.Properties

class VariableResolverTest {
    @ParameterizedTest
    @MethodSource("resolveProvider")
    fun shouldResolve(expected: String?, resolver: VariableResolver) {
        Assertions.assertSame(expected, resolver.resolve())
    }

    companion object {
        @JvmStatic
        fun resolveProvider(): List<Arguments> {
            val props = Properties()
            props.setProperty("HELLO", "WORLD")

            return listOf(
                Arguments.of("yee", VariableResolver("yee")),
                Arguments.of("a", VariableResolver("a") {
                    environment("SOME_UNKNOWN_ENV_VAR")
                }),
                Arguments.of("WORLD", VariableResolver("") {
                    environment("YEE_BOI")
                    property(props, "SWAGGER")
                    property(props, "HELLO")
                })
            )
        }
    }
}
