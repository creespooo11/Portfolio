package com.javiercrespo.contact.contact;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Payload submitted by the frontend contact form.
 */
public record ContactRequest(

        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 120, message = "El nombre no puede superar los 120 caracteres")
        // No line breaks or control characters: the name ends up in the
        // notification email's subject header.
        @Pattern(regexp = "^[^\\p{Cntrl}]*$", message = "El nombre no puede contener saltos de linea")
        String name,

        @NotBlank(message = "El email es obligatorio")
        @Email(message = "El email no tiene un formato valido")
        @Size(max = 200, message = "El email no puede superar los 200 caracteres")
        String email,

        @NotBlank(message = "El mensaje es obligatorio")
        @Size(max = 2000, message = "El mensaje no puede superar los 2000 caracteres")
        String message
) {
}
