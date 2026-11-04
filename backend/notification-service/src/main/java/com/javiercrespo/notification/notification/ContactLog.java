package com.javiercrespo.notification.notification;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Persisted record of a contact form submission processed by notification-service.
 * One document is written per {@link ContactCreatedEvent} consumed, regardless of
 * whether the notification email could actually be sent.
 */
@Document(collection = "contact_logs")
public class ContactLog {

    public enum Status {
        RECEIVED,
        EMAIL_SENT,
        EMAIL_SIMULATED,
        EMAIL_FAILED
    }

    @Id
    private String id;

    private String eventId;
    private String name;
    private String email;
    private String message;
    private Instant receivedAt;
    private Status status;

    protected ContactLog() {
    }

    public ContactLog(String eventId, String name, String email, String message, Instant receivedAt, Status status) {
        this.eventId = eventId;
        this.name = name;
        this.email = email;
        this.message = message;
        this.receivedAt = receivedAt;
        this.status = status;
    }

    public String getId() {
        return id;
    }

    public String getEventId() {
        return eventId;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getMessage() {
        return message;
    }

    public Instant getReceivedAt() {
        return receivedAt;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }
}
