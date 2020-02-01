package keepo.validation

private typealias Data = Map<String, Any?>

class DataSet(input: Any?) {
    private val data = toData(input)
    private val flattened = flatten(mutableMapOf(), data, "")
    private val keys = flattened.keys.toList()

    fun getMatchingKeys(keyPattern: String): List<String> {
        val pattern = keyPattern
            .replace(".", "\\.")
            .replace("*", "[^\\.]+")
        val regex = Regex("^$pattern$")
        return keys.filter(regex::matches)
    }

    fun getParentElements(keyPattern: String): Data {
        val result = START_OF_KEY_REGEX.matchEntire(keyPattern) ?: return mapOf(ROOT_KEY to this.data)
        val parentKey = result.groupValues[1]

        return getMatchingKeys(parentKey)
            .map { Pair(it, getValueAtKey(it)) }
            .toMap()
    }

    fun getValueAtKey(key: String): Any? {
        return flattened[key]
    }

    companion object {
        const val ROOT_KEY = "7a5f04b1-8ebc-4c35-976d-79e2b4cb1f0d"
        val START_OF_KEY_REGEX = Regex("^(.*)\\.[^\\.]+$")
        val END_OF_KEY_REGEX = Regex("^(?:.+\\.)?([^\\.]+)$")
    }
}

private fun toData(value: Any?): Data {
    return when (value) {
        is Map<*, *> -> value
            .map { Pair(it.key.toString(), it.value) }
            .toMap()
        is List<*> -> value
            .mapIndexed { index, v -> Pair(index.toString(), v) }
            .toMap()
        else -> emptyMap()
    }
}

private fun flatten(out: MutableMap<String, Any?>, data: Data, prefix: String): Map<String, Any?> {
    val pref = if (prefix.isEmpty()) "" else "$prefix."
    for ((key, value) in data) {
        val nextKey = "${pref}$key"
        out[nextKey] = value
        val next = toData(value)
        if (next.isNotEmpty()) {
            flatten(out, next, nextKey)
        }
    }
    return out
}
