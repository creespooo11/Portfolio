package com.javiercrespo.notification.notification;

import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.serializer.JsonSerializer;
import org.springframework.kafka.test.EmbeddedKafkaBroker;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.kafka.test.utils.KafkaTestUtils;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Publishes a ContactCreatedEvent to a real (embedded, in-process) Kafka
 * broker and verifies that {@link ContactEventListener} consumes it,
 * simulates the email (no SMTP configured in the test profile) and
 * persists a ContactLog with the expected data and final status.
 * MongoDB itself is not needed: ContactLogRepository is mocked so the
 * test stays self-contained without any external services.
 */
@SpringBootTest
@ActiveProfiles("test")
@EmbeddedKafka(partitions = 1, topics = "contact.created.test")
@TestPropertySource(properties = "spring.kafka.bootstrap-servers=${spring.embedded.kafka.brokers}")
class ContactEventListenerTest {

    @Autowired
    private EmbeddedKafkaBroker embeddedKafkaBroker;

    @MockitoBean
    private ContactLogRepository repository;

    @Value("${contact.kafka.topic}")
    private String topic;

    private KafkaTemplate<String, ContactCreatedEvent> testProducer;

    @BeforeEach
    void setUpProducer() {
        Map<String, Object> producerProps = KafkaTestUtils.producerProps(embeddedKafkaBroker);
        producerProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        producerProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        DefaultKafkaProducerFactory<String, ContactCreatedEvent> producerFactory =
                new DefaultKafkaProducerFactory<>(producerProps);
        testProducer = new KafkaTemplate<>(producerFactory);
    }

    @Test
    void consumingEventPersistsContactLogWithSimulatedEmailStatus() {
        when(repository.save(any(ContactLog.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ContactCreatedEvent event = new ContactCreatedEvent(
                UUID.randomUUID().toString(), "Grace Hopper", "grace@example.com",
                "Hola, esto es un mensaje de prueba.", Instant.now());

        testProducer.send(topic, event.eventId(), event);

        ArgumentCaptor<ContactLog> captor = ArgumentCaptor.forClass(ContactLog.class);
        verify(repository, timeout(10000).atLeast(1)).save(captor.capture());

        ContactLog saved = captor.getValue();
        assertThat(saved.getEventId()).isEqualTo(event.eventId());
        assertThat(saved.getName()).isEqualTo("Grace Hopper");
        assertThat(saved.getEmail()).isEqualTo("grace@example.com");
        assertThat(saved.getMessage()).isEqualTo("Hola, esto es un mensaje de prueba.");
        // No SMTP_HOST / NOTIFICATION_TARGET_EMAIL configured for the test profile,
        // so the email is simulated rather than sent or failed.
        assertThat(saved.getStatus()).isEqualTo(ContactLog.Status.EMAIL_SIMULATED);
    }
}
