package keepo.container

class Binding<T>(val resolver: Resolver<T>, val isSingleton: Boolean)
