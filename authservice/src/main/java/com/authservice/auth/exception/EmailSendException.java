package com.authservice.auth.exception;

public class EmailSendException extends RuntimeException {
    public EmailSendException() {
        super("Failed to send email");
    }
}
