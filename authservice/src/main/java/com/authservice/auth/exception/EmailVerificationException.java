package com.authservice.auth.exception;

public class EmailVerificationException extends RuntimeException {
    public EmailVerificationException() {
        super("Email not yet verified");
    }
}
