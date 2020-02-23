package keepo.container

typealias Resolver<T> = (Container) -> T

class Binding<T>(val resolver: Resolver<T>, val isSingleton: Boolean)
