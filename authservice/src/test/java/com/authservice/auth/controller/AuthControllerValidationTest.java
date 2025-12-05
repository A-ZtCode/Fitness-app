package com.authservice.auth.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import com.authservice.auth.dto.AuthResponseDTO;
import com.authservice.auth.model.User;
import com.authservice.auth.service.AuthService;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.any;
import static org.springframework.http.MediaType.APPLICATION_JSON;



@WebMvcTest(AuthController.class)
public class AuthControllerValidationTest {
    
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    private final String signupUrl = "/api/auth/signup";
    private final String loginUrl = "/api/auth/login";
    private final String register_success_msg = "User registered successfully! Please check your email to verify your account before logging in.";
    private final String login_success_msg = "User authenticated";

    private String createSignUpRequest(String email, String password, String firstName, String lastName) {
        return "{ \"email\": \"" + email 
            + "\", \"password\": \"" + password 
            + "\", \"firstName\": \"" + firstName 
            + "\", \"lastName\": \"" + lastName + "\" }";
    }

    private String createLoginRequest(String email, String password) {
        return "{ \"email\": \"" + email 
            + "\", \"password\": \"" + password + "\" }";
    }

    @Test
    public void signUp_invalidRequest_returnsBadRequest() throws Exception {
        char[] longName = new char[51];
        for (int i = 0; i < longName.length; i++) {
            longName[i] = 'a';
        }
        String name = new String(longName);
        String body = createSignUpRequest("invalid-email", "invalid", name, name);

        mockMvc.perform(post(signupUrl)
            .contentType(APPLICATION_JSON)
            .content(body))
            .andExpect(status().isBadRequest())
            .andExpect(content().contentTypeCompatibleWith(APPLICATION_JSON))
            .andExpect(jsonPath("$.message", containsString("Invalid email")))
            .andExpect(jsonPath("$.message", containsString("Password must contain")))
            .andExpect(jsonPath("$.message", containsString("Password must be between")))
            .andExpect(jsonPath("$.message", containsString("First name")))
            .andExpect(jsonPath("$.message", containsString("Last name")));
    }

    @Test
    public void signUp_validRequest_returnsOk() throws Exception {
        String body = createSignUpRequest("email@test.com", "ValidPassword#_+123", "Jane", "Doe");

        when(authService.registerUser(any())).thenReturn(new AuthResponseDTO(register_success_msg));

        mockMvc.perform(post(signupUrl)
            .contentType(APPLICATION_JSON)
            .content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value(register_success_msg));
    }

    @Test
    public void login_invalidRequest_returnsBadRequest() throws Exception {
        String body = createLoginRequest("invalid-email", "invalid");

        mockMvc.perform(post(loginUrl)
            .contentType(APPLICATION_JSON)
            .content(body))
            .andExpect(status().isBadRequest())
            .andExpect(content().contentTypeCompatibleWith(APPLICATION_JSON))
            .andExpect(jsonPath("$.message", containsString("Invalid email")))
            .andExpect(jsonPath("$.message", containsString("Password must be between")));
    }

    @Test
    public void login_validRequest_returnsOk() throws Exception {
        String body = createLoginRequest("email@test.com", "ValidPassword#_+123");
        User user = new User();
        user.setEmail("email@test.com");
        user.setPassword("encoded");
        user.setVerified(true);

        when(authService.authenticateUser(any()))
            .thenReturn(new AuthResponseDTO("jwt", login_success_msg));

        mockMvc.perform(post(loginUrl)
            .contentType(APPLICATION_JSON)
            .content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.jwt").value("jwt"))
            .andExpect(jsonPath("$.message").value(login_success_msg));
    }
}
