package com.javiercrespo.contact.contact;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies that a valid contact request is accepted and published to Kafka,
 * and that an invalid one is rejected with 400 and validation details.
 * The KafkaTemplate is mocked so the test does not require a running broker.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ContactControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private KafkaTemplate<String, ContactCreatedEvent> kafkaTemplate;

    @Value("${contact.kafka.topic}")
    private String topic;

    @Test
    @SuppressWarnings("unchecked")
    void validRequestIsAcceptedAndPublishedToKafkaTopic() throws Exception {
        SendResult<String, ContactCreatedEvent> sendResult = mock(SendResult.class);
        when(kafkaTemplate.send(anyString(), anyString(), any(ContactCreatedEvent.class)))
                .thenReturn(CompletableFuture.completedFuture(sendResult));

        String payload = """
                {
                  "name": "Ada Lovelace",
                  "email": "ada@example.com",
                  "message": "Hola, me interesa tu portfolio."
                }
                """;

        mockMvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isAccepted());

        ArgumentCaptor<ContactCreatedEvent> captor = ArgumentCaptor.forClass(ContactCreatedEvent.class);
        verify(kafkaTemplate).send(eq(topic), anyString(), captor.capture());

        ContactCreatedEvent published = captor.getValue();
        assertThat(published.name()).isEqualTo("Ada Lovelace");
        assertThat(published.email()).isEqualTo("ada@example.com");
        assertThat(published.message()).isEqualTo("Hola, me interesa tu portfolio.");
        assertThat(published.eventId()).isNotBlank();
    }

    @Test
    void blankFieldsAreRejectedWithBadRequestAndDetails() throws Exception {
        String payload = """
                {
                  "name": "",
                  "email": "not-an-email",
                  "message": ""
                }
                """;

        mockMvc.perform(post("/api/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.details").isArray())
                .andExpect(jsonPath("$.details.length()").value(3));
    }
}
