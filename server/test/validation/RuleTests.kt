package leif.validation

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class RequiredRuleTest {
    @Test
    fun shouldFailWithMissingKeyAtTopLevel() {
        val set = DataSet(mapOf(
            "a" to 1
        ))

        val rule = Rule.Required
        val errors = rule.execute(set, "b")

        assertEquals(1, errors.size)
    }

    @Test
    fun shouldSucceedWithKeyAtTopLevel() {
        val set = DataSet(mapOf(
            "a" to 1
        ))

        val errors = Rule.Required.execute(set, "a")

        assertEquals(0, errors.size)
    }

    @Test
    fun shouldExpandWildcardKeyAtRoot() {
        val set = DataSet(mapOf(
            "a" to 1,
            "b" to 2
        ))

        val errors = Rule.Required.execute(set, "*.a")

        assertEquals(2, errors.size)
        assertEquals("a.a", errors[0].key)
        assertEquals("b.a", errors[1].key)
    }

    @Test
    fun shouldExpandWildcardKeyAtRootAndOnlyErrorsForMissingKey() {
        val set = DataSet(mapOf(
            "a" to 1,
            "b" to mapOf(
                "a" to 2
            )
        ))

        val errors = Rule.Required.execute(set, "*.a")

        assertEquals(1, errors.size)
        assertEquals("a.a", errors[0].key)
    }

    @Test
    fun shouldNotCrashWhenParentIsNotAMap() {
        val set = DataSet(listOf(
            emptyList<String>()
        ))
        val errors = Rule.Required.execute(set, "*.a")
        assertEquals(1, errors.size)
        assertEquals("0.a", errors[0].key)
    }

    @Test
    fun shouldNotIncludeRootKeyInError() {
        val set = DataSet(mapOf(
            "a" to 1
        ))
        val errors = Rule.Required.execute(set, "b")
        assertEquals(1, errors.size)
        assertEquals("b", errors[0].key)
    }

    @Test
    fun shouldIncludeWholeParentKeyInError() {
        val set = DataSet(mapOf(
            "a" to mapOf(
                "b" to emptyList<String>()
            )
        ))
        val errors = Rule.Required.execute(set, "a.*.yee")
        assertEquals(1, errors.size)
        assertEquals("a.b.yee", errors[0].key)
    }
}

class StringRuleTest {
    @Test
    fun shouldDoNothingWhenKeyDoesNotExist() {
        val set = DataSet(mapOf(
            "a" to 1,
            "b" to mapOf(
                "a" to 2
            )
        ))

        assertEquals(0, Rule.String.execute(set, "c").size)
    }

    @Test
    fun shouldFailWhenValueIsNonString() {
        val set = DataSet(mapOf(
            "a" to 1
        ))

        assertEquals(1, Rule.String.execute(set, "a").size)
    }
}

class IntegerRuleTest {
    @Test
    fun shouldAcceptIntegerLikeStrings() {
        val set = DataSet(mapOf(
            "a" to "1"
        ))

        assertEquals(0, Rule.Integer.execute(set, "a").size)
    }

    @Test
    fun shouldAcceptLongs() {
        val set = DataSet(mapOf(
            "a" to 1.toLong()
        ))

        assertEquals(0, Rule.Integer.execute(set, "a").size)
    }
}

class MinimumRuleTest {
    @Test
    fun shouldSucceedWhenValueIsNotList() {
        val set = DataSet(mapOf(
            "a" to 1
        ))
        assertEquals(0, Rule.Minimum(1).execute(set, "a").size)
    }

    @Test
    fun shouldSucceedWhenListIsLargeEnough() {
        val set = DataSet(mapOf(
            "a" to listOf(1, 2, 3)
        ))
        assertEquals(0, Rule.Minimum(3).execute(set, "a").size)
    }

    @Test
    fun shouldFailWhenListIsTooSmall() {
        val set = DataSet(mapOf(
            "a" to listOf(1, 2)
        ))
        assertEquals(1, Rule.Minimum(3).execute(set, "a").size)
    }
}

class SumEqualRuleTest {
    @Test
    fun shouldDefaultNonNumericValuesToZero() {
        val set = DataSet(mapOf(
            "a" to listOf(1.0, -1.0, "yee")
        ))
        assertEquals(0, Rule.SumEqual(0.0).execute(set, "a.*").size)
    }

    @Test
    fun shouldFailWhenSumIsNotEqual() {
        val set = DataSet(mapOf(
            "a" to listOf(1.0, -0.5)
        ))
        assertEquals(1, Rule.SumEqual(0.0).execute(set, "a.*").size)
    }

    @Test
    fun shouldSucceedWhenEqual() {
        val set = DataSet(mapOf(
            "a" to listOf(1.0, -1.0)
        ))
        assertEquals(0, Rule.SumEqual(0.0).execute(set, "a.*").size)
    }
}