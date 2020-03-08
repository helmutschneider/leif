package leif.async

import java.util.concurrent.Future
import java.util.concurrent.ScheduledExecutorService
import java.util.concurrent.TimeUnit

private typealias Func<R> = () -> R
private typealias Func1<A, R> = (A) -> R

class DebounceFactory(val executor: ScheduledExecutorService) {
    fun <R> debounce(timeout: Long, handler: Func<R>): Func<Future<R>> {
        var future: Future<R>? = null
        return {
            future?.cancel(true)
            future = executor.schedule<R>({ handler() }, timeout, TimeUnit.MILLISECONDS)
            future!!
        }
    }

    fun <A, R> debounce(timeout: Long, handler: Func1<A, R>): Func1<A, Future<R>> {
        var future: Future<R>? = null
        return { a ->
            future?.cancel(true)
            future = executor.schedule<R>({ handler(a) }, timeout, TimeUnit.MILLISECONDS)
            future!!
        }
    }
}
