package com.javiercrespo.notification.notification;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface ContactLogRepository extends MongoRepository<ContactLog, String> {
}
