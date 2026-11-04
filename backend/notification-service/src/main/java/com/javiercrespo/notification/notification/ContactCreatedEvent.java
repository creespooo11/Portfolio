package com.javiercrespo.notification.notification;

import java.time.Instant;

/**
 * Mirrors the event published by contact-service to the {@code contact.created}
 * Kafka topic. Field names must stay in sync with
 * {@code com.javiercrespo.contact.contact.ContactCreatedEvent} in contact-service,
 * since the payload is plain JSON with no shared library between the two services.
 */
public record ContactCreatedEvent(
        String eventId,
        String name,
        String email,
        String message,
        Instant receivedAt
) {
}
