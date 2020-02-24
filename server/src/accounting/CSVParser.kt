package leif.accounting

import java.io.InputStream
import java.io.InputStreamReader
import java.lang.StringBuilder

class CSVParser(val columnOfAccountNumber: Int, val columnOfAccountDescription: Int) : AccountChartParser {
    override fun parse(stream: InputStream): Iterable<AccountLike> {
        val rdr = InputStreamReader(stream)
        val accounts = mutableMapOf<Int, AccountLike>()

        rdr.forEachLine { line ->
            val parts = parseLine(line)
            val num = parts.getOrNull(columnOfAccountNumber)?.toIntOrNull()
            val description = parts.getOrNull(columnOfAccountDescription)

            if (num != null && description != null) {
                accounts.put(num, AccountLike(num, description))
            }
        }

        return accounts.map { it.value }
    }

    private fun parseLine(line: String): List<String> {
        val buf = StringBuilder()
        val out = mutableListOf<String>()
        var isReadingQuotedText = false

        for (chr in line) {
            when {
                chr == '"' -> {
                    isReadingQuotedText = !isReadingQuotedText
                }
                chr == ',' && !isReadingQuotedText -> {
                    out.add(buf.toString())
                    buf.clear()
                }
                else -> buf.append(chr)
            }
        }

        if (buf.isNotEmpty()) {
            out.add(buf.toString())
        }

        return out
    }
}
