package keepo

import java.io.InputStream
import java.io.InputStreamReader
import java.lang.StringBuilder

class BasCSVParser : AccountChartParser {
    override fun parse(stream: InputStream): Iterable<AccountLike> {
        val rdr = InputStreamReader(stream)
        val accounts = mutableMapOf<Int, AccountLike>()
        val possibleIndices = listOf(Pair(2, 3), Pair(5, 6))

        rdr.forEachLine { line ->
            val parts = parseLine(line)
            val toInsert = possibleIndices
                .mapNotNull { parseIndexOfLine(parts, it) }
                .map { Pair(it.number, it) }
            accounts.putAll(toInsert)
        }

        return accounts.values.toList()
    }

    private fun parseIndexOfLine(parts: List<String>, index: Pair<Int, Int>): AccountLike? {
        val nmbr = parts.getOrNull(index.first)?.let(String::toIntOrNull)
        val desc = parts.getOrNull(index.second)?.let(String::trim)
        if (nmbr != null && desc != null && nmbr >= 1000) {
            return AccountLike(nmbr, desc)
        }
        return null
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

        return out
    }
}
