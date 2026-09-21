# Javier Crespo | Portfolio fullstack

Portfolio profesional construido como un monorepo fullstack para demostrar desarrollo web, Spring Boot, Vue 3 y arquitectura orientada a eventos.

## Arquitectura

```mermaid
flowchart LR
    Browser[Vue 3 frontend] -->|REST| Portfolio[portfolio-service]
    Browser -->|REST| Contact[contact-service]
    Portfolio --> Postgres[(PostgreSQL)]
    Contact -->|contact.created| Kafka[(Redpanda / Kafka)]
    Kafka --> Notification[notification-service]
    Notification --> Mongo[(MongoDB)]
    Notification --> SMTP[Proveedor de email]
```

El formulario de contacto no depende directamente del servicio de notificaciones: `contact-service` publica un evento y `notification-service` lo procesa de forma asíncrona. PostgreSQL se reserva para el contenido estructurado del portfolio y MongoDB para el registro de notificaciones.

## Estructura

```text
frontend/
backend/
  portfolio-service/
  contact-service/
  notification-service/
infra/
.github/workflows/
```

## Estado del proyecto

- [x] Fase 1: estructura inicial, documentación y dependencias locales.
- [x] Fase 2: `portfolio-service` con Spring Boot y PostgreSQL.
- [x] Fase 3: frontend Vue 3 + Vite.
- [x] Fase 4: `contact-service` y publicación de eventos.
- [ ] Fase 5: `notification-service` y MongoDB.
- [ ] Fase 6: integración end-to-end.
- [ ] Fase 7: CI/CD.
- [ ] Fase 8: despliegue.
- [ ] Fase 9: documentación y capturas finales.

## Requisitos locales

- Docker Desktop con Docker Compose v2.
- Git.
- Java 21 y Node.js LTS serán necesarios a partir de las fases de aplicación.

## Arranque de infraestructura local

1. Copia `.env.example` como `.env`.
2. Ejecuta:

   ```bash
   docker compose up -d
   ```

3. Comprueba el estado:

   ```bash
   docker compose ps
   ```

Para detener los contenedores:

```bash
docker compose down
```

Los datos se conservan en volúmenes Docker. Para eliminarlos también, usa `docker compose down -v`.

## Decisiones y alcance

Kafka/Redpanda es deliberadamente parte de la demostración de arquitectura, aunque sería más infraestructura de la necesaria para un formulario personal. En producción se podrá mantener con un proveedor Kafka compatible o sustituir el transporte por una cola gestionada; el contrato de evento mantendrá desacoplados el contacto y la notificación.

Las credenciales, claves SMTP y valores de producción no se guardan en Git. Usa `.env.example` como contrato de configuración.

## API disponible

Con el stack local arrancado, `portfolio-service` está disponible en `http://localhost:8081`:

- `GET /api/projects` y `GET /api/projects/{id}`: consulta de proyectos.
- `POST`, `PUT` y `DELETE /api/projects/{id}`: operaciones CRUD iniciales para administración local.
- `GET /api/skills`: consulta de tecnologías y habilidades.
- `GET /api/experience`: consulta de experiencia.

El contenido inicial se inserta automáticamente en PostgreSQL cuando las tablas están vacías.

`contact-service` está disponible en `http://localhost:8082`:

- `POST /api/contact`: recibe el envío del formulario de contacto (`name`, `email`, `message`). Valida los campos con Bean Validation y responde `400` con el detalle de cada error si algo falla.

Si la validación es correcta, `contact-service` **no escribe en ninguna base de datos**: serializa el evento en JSON y lo publica en el topic Kafka `contact.created` (variable `KAFKA_TOPIC_CONTACT_CREATED`) usando un `KafkaTemplate` contra Redpanda. La respuesta al frontend es `202 Accepted`, porque en ese momento el evento solo se ha publicado, no procesado. `notification-service` (Fase 5) se suscribirá a ese topic para consumir el evento y enviar la notificación de forma asíncrona, desacoplando por completo la recepción del formulario de su procesamiento.

## Frontend local

El frontend está disponible en `http://localhost:5173` cuando se ejecuta con Vite o en `http://localhost:5173` dentro de Docker Compose. Consume `/api/projects`, `/api/skills` y `/api/experience` mediante el proxy configurado, sin exponer la dirección interna del servicio al navegador.

## Licencia

Este proyecto se distribuye bajo la licencia MIT. Consulta [LICENSE](LICENSE).
