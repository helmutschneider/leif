package keepo.validation

class Validator(private val ruleSet: Map<String, List<RuleLike>>) {
    fun validate(data: Any?): List<ValidationError> {
        val errors = mutableListOf<ValidationError>()
        val set = DataSet(data)

        for ((keyPattern, rules) in ruleSet) {
            for (rule in rules) {
                errors.addAll(rule.execute(set, keyPattern))

                if (rule.shouldCancelRuleChain(set, keyPattern)) {
                    break
                }
            }
        }

        return errors
    }
}
