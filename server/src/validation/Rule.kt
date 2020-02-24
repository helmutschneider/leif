package leif.validation

import java.math.BigInteger

sealed class Rule : RuleLike {
    object Required : Rule() {
        override fun execute(dataSet: DataSet, keyPattern: kotlin.String): List<ValidationError> {
            val errors = mutableListOf<ValidationError>()
            val matches = DataSet.END_OF_KEY_REGEX.matchEntire(keyPattern)
                ?: throw kotlin.Exception("Could not find end of key")
            val parents = dataSet.getParentElements(keyPattern)
            val endOfKey = matches.groupValues[1]

            parents.forEach { parent ->
                val childSet = DataSet(parent.value)
                val keys = childSet.getMatchingKeys(endOfKey)

                if (keys.isEmpty()) {
                    val fullKey = if (parent.key == DataSet.ROOT_KEY) endOfKey else "${parent.key}.$endOfKey"
                    errors.add(ValidationError(fullKey, "$fullKey is required."))
                }
            }

            return errors
        }
    }

    object String : Rule() {
        override fun execute(dataSet: DataSet, keyPattern: kotlin.String): List<ValidationError> {
            return dataSet.getMatchingKeys(keyPattern)
                .map { Pair(it, dataSet.getValueAtKey(it)) }
                .filter { it.second !is kotlin.String }
                .map {
                    ValidationError(it.first, "${it.first} must be a string.")
                }
        }
    }

    object Integer : Rule() {
        override fun execute(dataSet: DataSet, keyPattern: kotlin.String): List<ValidationError> {
            return dataSet.getMatchingKeys(keyPattern)
                .map { Pair(it, dataSet.getValueAtKey(it)) }
                .filter {
                    it.second !is Int && it.second !is Long && it.second !is BigInteger
                }
                .map {
                    ValidationError(it.first, "${it.first} must be an integer.")
                }
        }
    }

    class Minimum(val value: Int) : Rule() {
        override fun execute(dataSet: DataSet, keyPattern: kotlin.String): List<ValidationError> {
            return dataSet.getMatchingKeys(keyPattern)
                .map { Pair(it, dataSet.getValueAtKey(it)) }
                .filter { pair ->
                    val maybeList = pair.second
                    maybeList is List<*> && maybeList.size < value
                }
                .map {
                    ValidationError(it.first, "${it.first} must contain at least $value element(s).")
                }
        }
    }

    class SumEqual(val value: Double) : Rule() {
        override fun execute(dataSet: DataSet, keyPattern: kotlin.String): List<ValidationError> {
            val sum = dataSet
                .getMatchingKeys(keyPattern)
                .map { key ->
                    val value = dataSet.getValueAtKey(key)

                    when (value) {
                        is Number -> value.toDouble()
                        else -> 0.0
                    }
                }
                .fold(0.0) { acc, value -> acc + value }

            if (sum != value) {
                return listOf(
                    ValidationError(keyPattern, "$keyPattern must have a sum equal to ${value}.")
                )
            }

            return emptyList()
        }
    }
}
