package com.authservice.auth.util;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

public class ValidationUtilsTests {

    @Test
    public void validateEmailAddressConstraints_validEmails_doNotThrow() {
        assertDoesNotThrow(() -> ValidationUtils.validateEmailAddressConstraints("validemail@test.com"));
        assertDoesNotThrow(() -> ValidationUtils.validateEmailAddressConstraints("valid_email@test-domain.co.uk"));
        assertDoesNotThrow(() -> ValidationUtils.validateEmailAddressConstraints("valid.email+123@test-domain.de"));
    }

    @Test
    public void validateEmailAddressConstraints_nullEmail_throwsIllegalArgument() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
            () -> ValidationUtils.validateEmailAddressConstraints(null));
        assertEquals("Email is required", ex.getMessage());
    }

    @Test
    public void validateEmailAddressConstraints_invalidEmails_throwIllegalArgument() {
        assertThrows(IllegalArgumentException.class, () -> ValidationUtils.validateEmailAddressConstraints("invalidemail"));
        assertThrows(IllegalArgumentException.class, () -> ValidationUtils.validateEmailAddressConstraints("invalid@.domain.com"));
        assertThrows(IllegalArgumentException.class, () -> ValidationUtils.validateEmailAddressConstraints(".dot@start.com"));
        assertThrows(IllegalArgumentException.class, () -> ValidationUtils.validateEmailAddressConstraints("local..dots@domain.com"));
        assertThrows(IllegalArgumentException.class, () -> ValidationUtils.validateEmailAddressConstraints("invalid@domaindots..com"));
        assertThrows(IllegalArgumentException.class, () -> ValidationUtils.validateEmailAddressConstraints("invalid@domain"));
    }

    @Test
    public void validateEmailAddressConstraints_localPartTooLong_throwsIllegalArgument() {
        StringBuilder local = new StringBuilder();
        for (int i = 0; i < 65; i++) {
            local.append("a");
        }
        String email = local + "@test-domain.com";
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
            () -> ValidationUtils.validateEmailAddressConstraints(email));
        assertTrue(ex.getMessage().toLowerCase().contains("local"));
    }

    @Test
    public void validateEmailAddressConstraints_domainTooLong_throwsIllegalArgument() {
        StringBuilder domain = new StringBuilder();
        for (int i = 0; i < 256; i++) {
            domain.append("a");
        }
        String email = "test@" + domain + ".com";
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
            () -> ValidationUtils.validateEmailAddressConstraints(email));
        assertTrue(ex.getMessage().toLowerCase().contains("domain"));
    }

    @Test
    public void validateEmailAddressConstraints_domainTooShort_throwsIllegalArgument() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
            () -> ValidationUtils.validateEmailAddressConstraints("a@b.c"));
            System.out.println(ex);
        assertTrue(ex.getMessage().toLowerCase().contains("domain"));
    }
}
