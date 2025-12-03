package com.authservice.auth.service;

import static java.time.Instant.now;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.authservice.auth.dto.AuthResponseDTO;
import com.authservice.auth.dto.LoginRequestDTO;
import com.authservice.auth.dto.PasswordResetDTO;
import com.authservice.auth.dto.SignUpRequestDTO;
import com.authservice.auth.dto.UpdateUserRequestDTO;
import com.authservice.auth.dto.UserResponseDTO;
import com.authservice.auth.exception.EmailAlreadyExistsException;
import com.authservice.auth.exception.EmailVerificationException;
import com.authservice.auth.exception.TooManyRequestsException;
import com.authservice.auth.exception.UserNotFoundException;
import com.authservice.auth.model.User;
import com.authservice.auth.repository.UserRepository;
import com.authservice.auth.util.ValidationUtils;

public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;

    @Autowired
    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtService jwtService, EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.emailService = emailService;
    }

    private void checkRateLimit(Instant lastRequest, int seconds) {
        if (lastRequest != null && lastRequest.isAfter(now().minusSeconds(seconds))) {
            long secondsRemaining = Duration.between(now(), lastRequest.plusSeconds(seconds)).getSeconds();
            throw new TooManyRequestsException("Too many requests - retry in: " + secondsRemaining + " seconds");
        }
    }

    public UserResponseDTO getUserByEmail(String email) {
        if (email == null || email.isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new UserNotFoundException();
        }
        return new UserResponseDTO(user.getId(), user.getEmail(), user.getFirstName(), user.getLastName());
    }

    public UserResponseDTO getUserById(String id) {
        if (id == null || id.isEmpty()) {
            throw new IllegalArgumentException("User ID is required");
        }
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            throw new UserNotFoundException();
        } 
        return new UserResponseDTO(user.getId(), user.getEmail(), user.getFirstName(), user.getLastName());
    }

    public AuthResponseDTO updateUserDetails(String id, UpdateUserRequestDTO request) {
        if (id == null || id.isEmpty()) {
            throw new IllegalArgumentException("User ID is required");
        }
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            throw new UserNotFoundException();
        }
        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }
        userRepository.save(user);
        return new AuthResponseDTO("User details updated successfully");
    }

    public AuthResponseDTO registerUser(SignUpRequestDTO request) {
        String email = ValidationUtils.normaliseAndValidateEmail(request.getEmail());

        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyExistsException();
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        userRepository.save(user);
                    
        try {
            emailService.sendVerificationEmail(user);
            user.setVerificationEmailSentAt(now());
            userRepository.save(user);
        } catch (Exception e) {
            throw new EmailVerificationException("Failed to send verification email");
        }
        
        return new AuthResponseDTO("User registered successfully! Please check your email to verify your account before logging in.");
    }

    public AuthResponseDTO authenticateUser(LoginRequestDTO request) {
        String email = ValidationUtils.normaliseAndValidateEmail(request.getEmail());

        User existingUser = userRepository.findByEmail(email);
        if (existingUser != null && passwordEncoder.matches(request.getPassword(), existingUser.getPassword())) {
            if (existingUser.isVerified()) {
                String token = jwtService.createUserToken(email);
                return new AuthResponseDTO("User authenticated", token);
            } else {
                throw new EmailVerificationException("Email not yet verified");
            }
        } else {
            throw new IllegalArgumentException("Email or password is incorrect - please try again");
        }
    }

    public void verifyEmail(String token) {
        String userId = emailService.extractUserIdFromToken(token);
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            throw new UserNotFoundException();
        }

        if (!user.isVerified()) {
            user.setVerified(true);
            userRepository.save(user);
        }
    }

    public void resendVerificationEmail(Map<String, String> request) {
        String rawEmail = request.get("email");
        if (rawEmail == null || rawEmail.isEmpty()) {
            throw new IllegalArgumentException("Email must be provided");
        }

        String email = ValidationUtils.normaliseAndValidateEmail(rawEmail);

        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new UserNotFoundException();
        }

        if (user.isVerified()) {
            throw new IllegalArgumentException("Email already verified - please log in");
        }

        Instant lastRequest = user.getVerificationEmailSentAt();
        checkRateLimit(lastRequest, 60);

        try {
            emailService.sendVerificationEmail(user);
            user.setVerificationEmailSentAt(now());
            userRepository.save(user);
        } catch (Exception e) {
            throw new EmailVerificationException("Failed to resend verification email");
        }
    }

    public void sendPasswordResetEmail(Map<String, String> request) {
        String rawEmail = request.get("email");
        if (rawEmail == null || rawEmail.isEmpty()) {
            throw new IllegalArgumentException("Email must be provided");
        }

        String email = ValidationUtils.normaliseAndValidateEmail(rawEmail);

        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new UserNotFoundException();
        }

        Instant lastRequest = user.getPasswordResetEmailSentAt();
        checkRateLimit(lastRequest, 60);

        emailService.sendPasswordResetEmail(user);
        user.setPasswordResetEmailSentAt(now());
        userRepository.save(user);
    }

    public void resetPassword(PasswordResetDTO request) {
        String token = request.getToken();
        String userId = emailService.extractUserIdFromToken(token);
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            throw new UserNotFoundException();
        }

        String newPassword = request.getNewPassword();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
