# Leif HTTP server
Copy `app.sample.properties` into `app.properties` and enter your database credentials. You may also change
the HTTP host or port if necessary.

### Start the server
```
./mvnw clean compile exec:java -Dexec.mainClass="leif.MainKt"
```

### Run the tests
```
./mvnw clean test
```

### Build a JAR-archive
```
./mvnw clean compile assembly:single
```
