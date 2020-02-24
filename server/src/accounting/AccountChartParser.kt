package leif.accounting

import java.io.InputStream

interface AccountChartParser {
    fun parse(stream: InputStream): Iterable<AccountLike>
}
