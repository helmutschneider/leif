package leif.database

class QueryCollection(val db: Database) {
    fun createAccount(number: Long, description: String, accountingPeriodId: Long): Long {
        val result = db.insert(QUERY_CREATE_ACCOUNT, listOf(number, description, accountingPeriodId))
        return result.first()
    }

    fun createAccountingPeriod(start: String, end: String, organizationId: Long): Long {
        val result = db.insert(QUERY_CREATE_ACCOUNTING_PERIOD, listOf(start, end, organizationId))
        return result.first()
    }

    fun createOrganization(name: String): Long {
        val result = db.insert(QUERY_CREATE_ORGANIZATION, listOf(name))
        return result.first()
    }

    fun createTransaction(amount: Long, accountId: Long, verificationId: Long): Long {
        val result = db.insert(QUERY_CREATE_TRANSACTION, listOf(amount, accountId, verificationId))
        return result.first()
    }

    fun createUser(username: String, passwordHash: ByteArray, organizationId: Long): Long {
        val result = db.insert(QUERY_CREATE_USER, listOf(username, passwordHash, organizationId))
        return result.first()
    }

    fun createVerification(date: String, description: String, accountingPeriodId: Long): Long {
        val result = db.insert(QUERY_CREATE_VERIFICATION, listOf(date, description, accountingPeriodId))
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
