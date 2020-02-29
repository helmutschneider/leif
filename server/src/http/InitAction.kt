package leif.http

import java.nio.file.Files
import java.nio.file.Path
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import leif.Application
import leif.accounting.CSVParser
import leif.crypto.PBKDF2Hasher
import leif.database.Database
import leif.database.QueryCollection
import leif.validation.Rule
import spark.Request
import spark.Response
import spark.Route

class InitAction(val app: Application) : Route {
    val ok = mapOf("ok" to true)

    override fun handle(request: Request, response: Response): Any? {
        val db = app.container.get<Database>()
        val exists = db.selectOne("SELECT 1 FROM information_schema.TABLES AS t WHERE t.TABLE_SCHEMA = ?", listOf(app.config.databaseName))

        if (exists != null) {
            return this.ok
        }

        val body = app.validate(request, mapOf(
            "organization" to listOf(Rule.Required, Rule.String),
            "username" to listOf(Rule.Required, Rule.String),
            "password" to listOf(Rule.Required, Rule.String)
        ))

        val schema = Files.readAllBytes(
            Path.of(System.getProperty("user.dir"), "data/mysql.sql")
        ).toString(Charsets.UTF_8)
        val accountsData = Files.newInputStream(
            Path.of(System.getProperty("user.dir"), "data/bas-2020-en.csv")
        )
        val accounts = CSVParser(0, 1).parse(accountsData)

        schema.split(';')
            .map(String::trim)
            .filter { it.isNotEmpty() }
            .forEach { db.statement(it) }

        val queries = QueryCollection(db)

        val orgId = queries.createOrganization(body["organization"] as String)
        val passwordHash = PBKDF2Hasher().hash((body["password"] as String).toByteArray())

        queries.createUser(
            body["username"] as String,
            passwordHash,
            orgId
        )

        val dateFmt = DateTimeFormatter.ofPattern("yyyy-MM-dd")
        val start = LocalDate.now()
            .withMonth(1)
            .withDayOfMonth(1)
        val end = LocalDate.now()
            .withMonth(12)
            .withDayOfMonth(31)

        val periodId = queries.createAccountingPeriod(
            start.format(dateFmt),
            end.format(dateFmt),
            orgId
        )

        for (account in accounts) {
            queries.createAccount(
                account.number,
                account.description,
                periodId
            )
        }
        return this.ok
    }
}
