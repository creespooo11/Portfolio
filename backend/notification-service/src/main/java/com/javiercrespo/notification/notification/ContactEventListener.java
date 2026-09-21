package com.javiercrespo.notification.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Consumes {@code contact.created} events published by contact-service.
 * For every event: attempts to send a notification email, then always
 * persists a {@link ContactLog} document reflecting the outcome, so the
 * event is never lost because of an email failure.
 */
@Component
public class ContactEventListener {

    private static final Logger log = LoggerFactory.getLogger(ContactEventListener.class);

    private final ContactLogRepository repository;
    private final NotificationEmailService emailService;

    public ContactEventListener(ContactLogRepository repository, NotificationEmailService emailService) {
        this.repository = repository;
        this.emailService = emailService;
    }

    @KafkaListener(topics = "${contact.kafka.topic}", groupId = "${spring.kafka.consumer.group-id}")
    public void onContactCreated(ContactCreatedEvent event) {
        log.info("Evento contact.created recibido: {} de {} <{}>", event.eventId(), event.name(), event.email());

        // Persist the event as RECEIVED first, so it is never lost even if the
        // process dies while sending the email or fails to send it at all.
        ContactLog contactLog = new ContactLog(
                event.eventId(), event.name(), event.email(), event.message(), event.receivedAt(),
                ContactLog.Status.RECEIVED);
        contactLog = repository.save(contactLog);

        EmailResult emailResult = emailService.send(event);
        contactLog.setStatus(toStatus(emailResult));
        repository.save(contactLog);

        log.info("Registro de contacto {} guardado en MongoDB con estado {}", event.eventId(), contactLog.getStatus());
    }

    private ContactLog.Status toStatus(EmailResult emailResult) {
        return switch (emailResult) {
            case SENT -> ContactLog.Status.EMAIL_SENT;
            case SIMULATED -> ContactLog.Status.EMAIL_SIMULATED;
            case FAILED -> ContactLog.Status.EMAIL_FAILED;
        };
    }
}
