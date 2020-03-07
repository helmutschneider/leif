package leif

import leif.config.VariableResolver
import spark.Service
import java.nio.file.Paths
import java.util.*

fun main() {
    val path = Paths.get(
        System.getProperty("leif.properties") ?: System.getProperty("user.dir").plus("/app.properties")
    )
    val file = path.toFile()
    val props = Properties()

    if (file.exists()) {
        file.inputStream().use {
            props.load(it)
        }
    }

    val config = ApplicationConfig(
        httpPort = VariableResolver("8000") {
            environment("PORT")
            property(props, "http.port")
        }.resolve().toInt()
    )
    val app = Application(config)
    app.container.get<Service>()
}
