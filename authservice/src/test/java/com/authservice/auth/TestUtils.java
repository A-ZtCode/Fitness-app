package com.authservice.auth;

import com.authservice.auth.dto.LoginRequestDTO;
import com.authservice.auth.dto.SignUpRequestDTO;
import com.authservice.auth.model.User;

public class TestUtils {
    public static final String EMAIL = "testemail@test.com";
    public static final String USER_ID = "testId";
    public static final String PASSWORD = "Password-123";
    public static final String WRONG_PASSWORD = "wrongPassword-123";
    public static final String ENCODED_PASSWORD = "encodedPassword-123";
    public static final String FIRST_NAME = "Jane";
    public static final String LAST_NAME = "Doe";
    public static final String USER_REGISTERED_MSG = "User registered successfully! Please check your email to verify your account before logging in.";
    public static final String USER_AUTHENTICATED_MSG = "User authenticated";
    public static final String TOKEN = "jwt-token-for-use-in-tests-123456789";

    public static SignUpRequestDTO createSignUpRequestDto(String email, String password) {
        SignUpRequestDTO request = new SignUpRequestDTO();
        request.setEmail(email);
        request.setPassword(password);
        request.setFirstName(FIRST_NAME);
        request.setLastName(LAST_NAME);
        return request;
    }

    public static LoginRequestDTO createLoginRequestDto(String email, String password) {
        LoginRequestDTO request = new LoginRequestDTO();
        request.setEmail(email);
        request.setPassword(password);
        return request;
    }

    public static User createUser(String email, String password, String firstName, String lastName) {
        User user = new User();
        user.setId(USER_ID);
        user.setEmail(email);
        user.setPassword(password);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        return user;
    }

    public static String createSignUpRequestJson(String email, String password, String firstName, String lastName) {
        return "{ \"email\": \"" + email 
            + "\", \"password\": \"" + password 
            + "\", \"firstName\": \"" + firstName 
            + "\", \"lastName\": \"" + lastName + "\" }";
    }

    public static String createLoginRequestJson(String email, String password) {
        return "{ \"email\": \"" + email 
            + "\", \"password\": \"" + password + "\" }";
    }

    public static String createEmailRequestJson(String email) {
        return "{ \"email\": \"" + email + "\" }";
    }

    public static String createPasswordResetRequestJson(String token, String newPassword) {
        return "{ \"token\": \"" + token 
            + "\", \"newPassword\": \"" + newPassword + "\" }";
    }
}