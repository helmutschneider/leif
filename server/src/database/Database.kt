package leif.database

interface Database {
    fun selectOne(query: String, params: List<Any?> = emptyList()): Map<String, Any?>?
    fun select(query: String, params: List<Any?> = emptyList()): List<Map<String, Any?>>
    fun insert(query: String, params: List<Any?> = emptyList()): List<Int>
    fun update(query: String, params: List<Any?> = emptyList()): Int
    fun delete(query: String, params: List<Any?> = emptyList()): Boolean
    fun statement(query: String, params: List<Any?> = emptyList()): Unit
}
