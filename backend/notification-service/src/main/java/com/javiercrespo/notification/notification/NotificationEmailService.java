package com.javiercrespo.notification.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Sends the "new contact message" notification email.
 * <p>
 * When SMTP_HOST or NOTIFICATION_TARGET_EMAIL are not configured (the default
 * for a local environment without real mail credentials), sending is simulated:
 * the attempt is logged clearly and no real email is dispatched, so the rest of
 * the flow keeps working without a real SMTP server.
 */
@Service
public class NotificationEmailService {

    private static final Logger log = LoggerFactory.getLogger(NotificationEmailService.class);

    private final JavaMailSender mailSender;
    private final String smtpHost;
    private final String fromAddress;
    private final String targetEmail;

    public NotificationEmailService(ObjectProvider<JavaMailSender> mailSenderProvider,
                                     @Value("${SMTP_HOST:}") String smtpHost,
                                     @Value("${SMTP_USER:}") String smtpUser,
                                     @Value("${notification.target-email:}") String targetEmail) {
        this.mailSender = mailSenderProvider.getIfAvailable();
        this.smtpHost = smtpHost == null ? "" : smtpHost.trim();
        this.fromAddress = (smtpUser == null || smtpUser.isBlank()) ? "notifications@portfolio.local" : smtpUser.trim();
        this.targetEmail = targetEmail == null ? "" : targetEmail.trim();
    }

    public EmailResult send(ContactCreatedEvent event) {
        if (!isConfigured()) {
            log.info("[SMTP simulado] No hay SMTP configurado (SMTP_HOST / NOTIFICATION_TARGET_EMAIL vacios). "
                    + "Se simula el envio del email de notificacion para el mensaje de {} <{}> (evento {}).",
                    event.name(), event.email(), event.eventId());
            return EmailResult.SIMULATED;
        }

        try {
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            mailMessage.setFrom(fromAddress);
            mailMessage.setTo(targetEmail);
            mailMessage.setSubject("Nuevo mensaje de contacto de " + event.name());
            mailMessage.setText("""
                    Nombre: %s
                    Email: %s

                    Mensaje:
                    %s
                    """.formatted(event.name(), event.email(), event.message()));

            mailSender.send(mailMessage);
            log.info("Email de notificacion enviado a {} para el evento {}", targetEmail, event.eventId());
            return EmailResult.SENT;
        } catch (MailException ex) {
            log.error("Fallo al enviar el email de notificacion para el evento {}", event.eventId(), ex);
            return EmailResult.FAILED;
        }
    }

    private boolean isConfigured() {
        return mailSender != null && !smtpHost.isBlank() && !targetEmail.isBlank();
    }
}
