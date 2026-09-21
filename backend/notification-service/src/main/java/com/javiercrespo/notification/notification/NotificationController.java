package com.javiercrespo.notification.notification;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private static final int MAX_PAGE_SIZE = 100;

    private final ContactLogRepository repository;

    public NotificationController(ContactLogRepository repository) {
        this.repository = repository;
    }

    /**
     * Lists processed contact submissions, newest first, so it is easy to
     * verify from the frontend or curl that events are being consumed.
     */
    @GetMapping
    public Page<ContactLog> findAll(@RequestParam(defaultValue = "0") int page,
                                     @RequestParam(defaultValue = "20") int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        return repository.findAll(PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "receivedAt")));
    }
}
