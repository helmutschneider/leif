package leif.validation

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class ValidatorTest {
    @Test
    fun shouldInvokeRulesWithoutMatchingKeys() {
        var didExecute = false
        val validator = Validator(mapOf(
            "a" to listOf(object : RuleLike {
                override fun execute(dataSet: DataSet, keyPattern: String): List<ValidationError> {
                    didExecute = true
                    return emptyList()
                }
            })
        ))

        validator.validate(emptyList<String>())

        assertEquals(true, didExecute)
    }

    @Test
    fun shouldCancelRuleChainIfAskedTo() {
        val didExecute = mutableListOf(false, false)
        val first = object : RuleLike {
            override fun execute(dataSet: DataSet, keyPattern: String): List<ValidationError> {
                didExecute[0] = true
                return emptyList()
            }
            override fun shouldCancelRuleChain(dataSet: DataSet, keyPattern: String) = true
        }
        val second = object : RuleLike {
            override fun execute(dataSet: DataSet, keyPattern: String): List<ValidationError> {
                didExecute[1] = true
                return emptyList()
            }
        }
        val validator = Validator(mapOf(
            "a" to listOf(first, second)
        ))

        validator.validate(listOf(1))

        assertEquals(listOf(true, false), didExecute)
    }
}
