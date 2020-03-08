package leif.events

import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Test

class EmitterTest {
    sealed class IOEvent {
        class Read(val result: String) : IOEvent()
        class Write(val data: String) : IOEvent()
    }

    @Test
    fun shouldTriggerEvents() {
        val emitter = Emitter<IOEvent>()
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
        val emitter = Emitter<IOEvent>()
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

    @Test
    fun shouldListenToManyEvents() {
        val emitter = Emitter<IOEvent>()
        val results = mutableListOf<String>()
        emitter.listenAll { event ->
            when (event) {
                is IOEvent.Read -> results.add(event.result)
                is IOEvent.Write -> results.add(event.data)
            }
        }
        emitter.trigger(IOEvent.Read("a"))
        emitter.trigger(IOEvent.Write("b"))

        Assertions.assertEquals(listOf("a", "b"), results)
    }
}
