package leif.validation

interface RuleLike {
    fun execute(dataSet: DataSet, keyPattern: String): List<ValidationError>
    fun shouldCancelRuleChain(dataSet: DataSet, keyPattern: String): Boolean = false
}
