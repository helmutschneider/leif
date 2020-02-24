package leif.database

class QueryCollection(val db: Database) {
    fun createAccount(number: Long, description: String, accountingPeriodId: Long)
        = insertOne(QUERY_CREATE_ACCOUNT, number, description, accountingPeriodId)

    fun createAccountingPeriod(start: String, end: String, organizationId: Long)
        = insertOne(QUERY_CREATE_ACCOUNTING_PERIOD, start, end, organizationId)

    fun createOrganization(name: String)
        = insertOne(QUERY_CREATE_ORGANIZATION, name)

    fun createTransaction(amount: Long, accountId: Long, verificationId: Long)
        = insertOne(QUERY_CREATE_TRANSACTION, amount, accountId, verificationId)

    fun createUser(username: String, passwordHash: ByteArray, organizationId: Long)
        = insertOne(QUERY_CREATE_USER, username, passwordHash, organizationId)

    fun createVerification(date: String, description: String, accountingPeriodId: Long)
        = insertOne(QUERY_CREATE_VERIFICATION, date, description, accountingPeriodId)

    private fun insertOne(query: String, vararg params: Any?): Long {
        val result = db.insert(query, listOf(*params))
        return result.first()
    }

    companion object {
        const val QUERY_CREATE_ACCOUNT = """
           INSERT INTO account (number, description, accounting_period_id)
                VALUES (?, ?, ?) 
        """
        const val QUERY_CREATE_ACCOUNTING_PERIOD = """
            INSERT INTO accounting_period (start, end, organization_id)
                 VALUES (?, ?, ?)
        """
        const val QUERY_CREATE_ORGANIZATION = """
            INSERT INTO organization (name)
                 VALUES (?)
        """
        const val QUERY_CREATE_TRANSACTION = """
            INSERT INTO `transaction` (amount, account_id, verification_id)
                 VALUES (?, ?, ?)
        """
        const val QUERY_CREATE_USER = """
            INSERT INTO `user` (username, password, organization_id)
                 VALUES (?, ?, ?)
        """
        const val QUERY_CREATE_VERIFICATION = """
            INSERT INTO verification (date, description, accounting_period_id)
                 VALUES (?, ?, ?)
        """
    }
}
