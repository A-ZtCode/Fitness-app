package com.authservice.auth.controller;

import com.authservice.auth.dto.AuthResponseDTO;
import com.authservice.auth.dto.LoginRequestDTO;
import com.authservice.auth.dto.PasswordResetDTO;
import com.authservice.auth.dto.SignUpRequestDTO;
import com.authservice.auth.dto.UpdateUserRequestDTO;
import com.authservice.auth.dto.UserResponseDTO;
import com.authservice.auth.service.AuthService;

import java.util.Map;

import javax.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @GetMapping("/user")
    public ResponseEntity<?> getUserByEmail(@RequestParam("email") String email) {
        UserResponseDTO userDto = authService.getUserByEmail(email);
        return ResponseEntity.ok(userDto);
    }

    @GetMapping("/user/{id}")
    public ResponseEntity<?> getUserById(@PathVariable("id") String id) {
        UserResponseDTO userDto = authService.getUserById(id);
        return ResponseEntity.ok(userDto);
    }

    @PatchMapping("/user/{id}")
    public ResponseEntity<?> updateUserDetails(@PathVariable("id") String id, @RequestBody UpdateUserRequestDTO request) {
        authService.updateUserDetails(id, request);
        return ResponseEntity.ok("User details updated successfully");
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignUpRequestDTO request) {
        AuthResponseDTO response = authService.registerUser(request);
        return ResponseEntity.ok(response);
}

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequestDTO request) {
        AuthResponseDTO response = authService.authenticateUser(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/verify")
    public ResponseEntity<?> verifyEmail(@RequestParam String token) {
        authService.verifyEmail(token);
        return ResponseEntity.ok("Email verified successfully");
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<?> resendVerificationEmail(@RequestBody Map<String, String> request) {
        authService.resendVerificationEmail(request);
        return ResponseEntity.ok("Verification email resent");
    }

    @PostMapping("/send-reset-email")
    public ResponseEntity<?> sendPasswordResetEmail(@RequestBody Map<String, String> request) {
        authService.sendPasswordResetEmail(request);
        return ResponseEntity.ok("Password reset email sent");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody PasswordResetDTO request) {
        authService.resetPassword(request);
        return ResponseEntity.ok("Password changed successfully");
    }
} 

