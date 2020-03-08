package leif.async

import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test
import java.util.concurrent.Executors

class DebounceFactoryTest {
    val factory = DebounceFactory(
        Executors.newSingleThreadScheduledExecutor()
    )

    @Test
    fun shouldInvokeFunctionAfterTimeout() {
        var didExecute = false
        val fn = factory.debounce(100) { ->
            didExecute = true
        }
        fn()
        Assertions.assertEquals(false, didExecute)
        Thread.sleep(120)
        Assertions.assertEquals(true, didExecute)
    }

    @Test
    fun shouldKeepWaitingIfFunctionIsCalledRepeatedly() {
        var didExecute = false
        val fn = factory.debounce(100) { ->
            didExecute = true
        }
        fn()
        fn()
        Assertions.assertEquals(false, didExecute)
        Thread.sleep(50)
        fn()
        Assertions.assertEquals(false, didExecute)
        Thread.sleep(70)
        Assertions.assertEquals(false, didExecute)
        Thread.sleep(50)
        Assertions.assertEquals(true, didExecute)
    }
}
