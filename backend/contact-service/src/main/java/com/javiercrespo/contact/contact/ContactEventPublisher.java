package com.javiercrespo.contact.contact;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

/**
 * Publishes {@link ContactCreatedEvent}s to Kafka instead of persisting
 * anything directly. notification-service is expected to consume the topic
 * and take care of actually delivering the notification.
 */
@Service
public class ContactEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(ContactEventPublisher.class);

    private final KafkaTemplate<String, ContactCreatedEvent> kafkaTemplate;
    private final String topic;

    public ContactEventPublisher(KafkaTemplate<String, ContactCreatedEvent> kafkaTemplate,
                                  @Value("${contact.kafka.topic}") String topic) {
        this.kafkaTemplate = kafkaTemplate;
        this.topic = topic;
    }

    public void publish(ContactCreatedEvent event) {
        kafkaTemplate.send(topic, event.eventId(), event).whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("Failed to publish contact.created event {}", event.eventId(), ex);
            } else {
                log.info("Published contact.created event {} to topic {} [partition {}]",
                        event.eventId(), topic, result.getRecordMetadata().partition());
            }
        });
    }
}
