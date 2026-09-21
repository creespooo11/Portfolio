package com.javiercrespo.contact.contact;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/contact")
public class ContactController {

    private final ContactEventPublisher publisher;

    public ContactController(ContactEventPublisher publisher) {
        this.publisher = publisher;
    }

    /**
     * Accepts a contact form submission and publishes it to Kafka for
     * asynchronous processing. Returns 202 Accepted because the event has
     * only been published at this point, not yet processed.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void submit(@Valid @RequestBody ContactRequest request) {
        publisher.publish(ContactCreatedEvent.from(request));
    }
}
