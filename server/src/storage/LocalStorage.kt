package leif.storage

import java.nio.file.Files
import java.nio.file.Path

class LocalStorage(val root: Path) : Storage {
    override fun get(key: String): ByteArray? {
        val path = root.resolve(Path.of(key))
        return path.toFile().readBytes()
    }

    override fun put(key: String, data: ByteArray) {
        val path = root.resolve(Path.of(key))
        Files.write(path, data)
    }

    override fun delete(key: String) {
        val path = root.resolve(Path.of(key))
        Files.delete(path)
    }
}
