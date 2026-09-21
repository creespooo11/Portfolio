package com.javiercrespo.notification.notification;

/**
 * Outcome of attempting to send the notification email for a contact event.
 */
public enum EmailResult {
    SENT,
    SIMULATED,
    FAILED
}
