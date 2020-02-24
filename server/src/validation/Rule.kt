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
}
