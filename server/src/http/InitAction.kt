package leif.http

import java.nio.file.Files
import java.nio.file.Path
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import leif.Application
import leif.accounting.CSVParser
import leif.crypto.PBKDF2Hasher
import leif.database.Database
import leif.validation.Rule
import spark.Request
import spark.Response
import spark.Route

class InitAction(val app: Application) : Route {
    val ok = mapOf("ok" to true)

    override fun handle(request: Request, response: Response): Any? {
        val db = app.container.get<Database>()
        val exists = db.selectOne("SELECT 1 FROM information_schema.TABLES AS t WHERE t.TABLE_SCHEMA = ?", listOf("keepo"))

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

        val orgIds = db.insert("INSERT INTO organization (organization_id, name) VALUES (?, ?)", listOf(1, body["organization"]))
        val passwordHash = PBKDF2Hasher().hash((body["password"] as String).toByteArray())

        db.insert("INSERT INTO `user` (username, password, organization_id) VALUES (?, ?, ?)", listOf(
            body["username"],
            passwordHash,
            orgIds.first()
        ))

        val dateFmt = DateTimeFormatter.ofPattern("yyyy-MM-dd")
        val start = LocalDate.now()
            .withMonth(1)
            .withDayOfMonth(1)
        val end = LocalDate.now()
            .withMonth(12)
            .withDayOfMonth(31)

        val periodIds = db.insert("INSERT INTO accounting_period (start, end, organization_id) VALUES (?, ?, ?)", listOf(
            start.format(dateFmt),
            end.format(dateFmt),
            orgIds.first()
        ))

        for (account in accounts) {
            db.insert("INSERT INTO account (number, description, accounting_period_id) VALUES (?, ?, ?)", listOf(
                account.number,
                account.description,
                periodIds.first()
            ))
        }
        return this.ok
    }
}
