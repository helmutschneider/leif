package leif.storage

import com.google.cloud.storage.BlobId
import com.google.cloud.storage.BlobInfo
import com.google.cloud.storage.Storage as GoogleStorage

class GoogleCloudStorage(val client: GoogleStorage, val bucket: String) : Storage {
    override fun get(key: String): ByteArray? {
        return client.get(BlobId.of(bucket, key))?.getContent()
    }

    override fun put(key: String, data: ByteArray) {
        val info = BlobInfo.newBuilder(bucket, key).build()
        client.create(info, data)
    }

    override fun delete(key: String) {
        client.delete(BlobId.of(bucket, key))
    }
}
