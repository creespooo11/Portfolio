package com.javiercrespo.contact.contact;

import java.time.Instant;
import java.util.UUID;

/**
 * Event published to the {@code contact.created} Kafka topic after a contact
 * form submission is validated. notification-service (Fase 5) consumes this
 * event to deliver the notification asynchronously.
 */
public record ContactCreatedEvent(
        String eventId,
        String name,
        String email,
        String message,
        Instant receivedAt
) {

    public static ContactCreatedEvent from(ContactRequest request) {
        return new ContactCreatedEvent(
                UUID.randomUUID().toString(),
                request.name(),
                request.email(),
                request.message(),
                Instant.now());
    }
}
