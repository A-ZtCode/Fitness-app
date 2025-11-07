package com.authservice.auth.service;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.authservice.auth.exception.InvalidTokenException;
import com.authservice.auth.model.User;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final JwtService jwtService;

    @Autowired
    public EmailService(JavaMailSender mailSender, JwtService jwtService) {
        this.mailSender = mailSender;
        this.jwtService = jwtService;
    }

    public void sendVerificationEmail(User user) {
        String token = jwtService.createEmailVerificationToken(user.getId());
        try {
            String url = "http://localhost:8080/api/auth/verify?token=" + URLEncoder.encode(token, "UTF-8");
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(user.getEmail());
            message.setSubject("MLA Fitness App - Email Verification");
            message.setText("Click the link to verify your email: " + url);
            mailSender.send(message);
        } catch (UnsupportedEncodingException e) {
            throw new RuntimeException(e);
        }
    }

    public String extractUserIdFromVerificationToken(String token) {
        String userId;
        try {
            userId = jwtService.parseToken(token).getSubject();
        } catch (Exception e) {
            throw new InvalidTokenException("Invalid or expired token", e);
        }
        return userId;
    }

}
