package com.authservice.auth.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import static com.authservice.auth.TestUtils.*;

import javax.mail.Session;
import javax.mail.internet.MimeMessage;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.javamail.JavaMailSender;

import com.authservice.auth.exception.InvalidTokenException;
import com.authservice.auth.model.User;

import io.jsonwebtoken.Claims;

public class EmailServiceTest {
    private JavaMailSender mailSender;
    private JwtService jwtService;
    private EmailService emailService;

    @BeforeEach
    public void setUp() {
        mailSender = mock(JavaMailSender.class);
        jwtService = mock(JwtService.class);
        emailService = new EmailService(mailSender, jwtService);
    }

    @Test
    public void sendVerificationEmail_sendsEmail() {
        User user = createUser(EMAIL, PASSWORD, FIRST_NAME, LAST_NAME);

        when(jwtService.createEmailVerificationToken(user.getId())).thenReturn(TOKEN);

        MimeMessage message = mock(MimeMessage.class);
        when(mailSender.createMimeMessage()).thenReturn(message);

        emailService.sendVerificationEmail(user);

        verify(jwtService, times(1)).createEmailVerificationToken(user.getId());
        verify(mailSender, times(1)).send(message);
    }

    @Test
    public void sendVerificationEmail_sendsEmailWithCorrectContent() throws Exception {
        User user = createUser(EMAIL, PASSWORD, FIRST_NAME, LAST_NAME);

        when(jwtService.createEmailVerificationToken(user.getId())).thenReturn(TOKEN);

        MimeMessage message = new MimeMessage((Session) null);
        when(mailSender.createMimeMessage()).thenReturn(message);

        emailService.sendVerificationEmail(user);

        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender).send(captor.capture());

        MimeMessage sentMessage = captor.getValue();
        String content = (String) sentMessage.getContent();
        
        assertEquals(user.getEmail(), sentMessage.getAllRecipients()[0].toString());
        assertEquals("MLA Fitness App - Verify your email", sentMessage.getSubject());
        assertTrue(content.contains("Hi " + user.getFirstName()));
        assertTrue(content.contains("verify?token=" + TOKEN));
    }

    @Test
    public void sendVerificationEmail_mailError_throwsRuntimeException() {
        User user = createUser(EMAIL, PASSWORD, FIRST_NAME, LAST_NAME);

        when(jwtService.createEmailVerificationToken(user.getId())).thenReturn(TOKEN);

        when(mailSender.createMimeMessage()).thenThrow(new RuntimeException("Mail server error"));

        assertThrows(RuntimeException.class, () -> emailService.sendVerificationEmail(user));
        verify(jwtService, times(1)).createEmailVerificationToken(user.getId());
        verify(mailSender, times(1)).createMimeMessage();
    }

    @Test
    public void extractUserIdFromVerificationToken_validToken_returnsCorrectUserId() {
        Claims jwt = mock(Claims.class);

        when(jwtService.parseToken(TOKEN)).thenReturn(jwt);
        when(jwt.getSubject()).thenReturn(USER_ID);

        String extractedUserId = emailService.extractUserIdFromToken(TOKEN);

        assertEquals(USER_ID, extractedUserId);
    }

    @Test
    public void extractUserIdFromToken_invalidToken_throwsInvalidTokenException() {
        String token = "invalid-token";

        when(jwtService.parseToken(token)).thenThrow(new RuntimeException("Token parsing error"));

        assertThrows(InvalidTokenException.class, () -> {
            emailService.extractUserIdFromToken(token);
        });
    }
}
