package leif

import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test

class EventEmitterTest {
    sealed class IOEvent {
        class Read(val result: String) : IOEvent()
        class Write(val data: String) : IOEvent()
    }

    @Test
    fun shouldTriggerEvents() {
        val emitter = EventEmitter<IOEvent>()
        var result: Any? = null

        emitter.listen<IOEvent.Read> {
            result = it.result
        }
        emitter.listen<IOEvent.Write> {
            result = it.data
        }

        emitter.trigger(IOEvent.Read("YEE"))
        Assertions.assertEquals("YEE", result)
    }

    @Test
    fun shouldTriggerMultipleListeners() {
        val emitter = EventEmitter<IOEvent>()
        val result = mutableListOf<Any?>()

        emitter.listen<IOEvent.Read> {
            result.add(it.result)
        }
        emitter.listen<IOEvent.Read> {
            result.add(it.result)
        }

        emitter.trigger(IOEvent.Read("tjo"))

        Assertions.assertEquals(listOf("tjo", "tjo"), result)
    }
}
