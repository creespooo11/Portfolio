FROM eclipse-temurin:21-jre

WORKDIR /app
# Run as an unprivileged user, not root.
RUN useradd --system --uid 1001 --no-create-home app
COPY target/notification-service-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8083
USER app
ENTRYPOINT ["java", "-jar", "app.jar"]
