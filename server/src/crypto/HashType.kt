package keepo.crypto

sealed class HashType {
    object Digest : HashType()
    object Mac : HashType()
    object Password : HashType()
}
