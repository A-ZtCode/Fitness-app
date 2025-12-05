package com.authservice.auth.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.authservice.auth.dto.AuthResponseDTO;
import com.authservice.auth.dto.LoginRequestDTO;
import com.authservice.auth.dto.SignUpRequestDTO;
import com.authservice.auth.dto.UserResponseDTO;
import com.authservice.auth.exception.UserNotFoundException;
import com.authservice.auth.service.AuthService;

@WebMvcTest(AuthController.class)
public class AuthControllerTest {

    private static final String EMAIL = "testemail@test.com";
    private static final String USER_ID = "testId";
    private static final String FIRST_NAME = "Jane";
    private static final String LAST_NAME = "Doe";
    private static final String USER_REGISTERED_MSG = "User registered successfully! Please check your email to verify your account before logging in.";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

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
    public void getUserByEmail_validEmail_returnsUserResponse() throws Exception {
        UserResponseDTO userDto = new UserResponseDTO();
        when(authService.getUserByEmail(EMAIL)).thenReturn(userDto);

        mockMvc.perform(get("/api/auth/user")
            .param("email", EMAIL))
            .andExpect(status().isOk());

        verify(authService).getUserByEmail(EMAIL);
    }

    @Test
    public void getUserByEmail_userDoesNotExist_returns404() throws Exception {
        when(authService.getUserByEmail(EMAIL)).thenThrow(new UserNotFoundException());

        mockMvc.perform(get("/api/auth/user")
            .param("email", EMAIL))
            .andExpect(status().isNotFound());
    }

    @Test
    public void getUserByEmail_missingEmail_returns400() throws Exception {
        mockMvc.perform(get("/api/auth/user"))
            .andExpect(status().isBadRequest());
    }

    @Test
    public void getUserById_validId_returnsUserResponse() throws Exception {
        UserResponseDTO userDto = new UserResponseDTO();
        when(authService.getUserById(USER_ID)).thenReturn(userDto);

        mockMvc.perform(get("/api/auth/user/{id}", USER_ID))
            .andExpect(status().isOk());

        verify(authService).getUserById(USER_ID);
    }

    @Test
    public void getUserById_userDoesNotExist_returns404() throws Exception {
        when(authService.getUserById(USER_ID)).thenThrow(new UserNotFoundException());

        mockMvc.perform(get("/api/auth/user/{id}", USER_ID))
            .andExpect(status().isNotFound());
    }

    @Test
    public void getUserById_missingId_returns400() throws Exception {
        mockMvc.perform(get("/api/auth/user/{id}", ""))
            .andExpect(status().isBadRequest());
    }

    @Test
    public void registerUser_returnsOk() throws Exception {
        SignUpRequestDTO dto = new SignUpRequestDTO();
        AuthResponseDTO response = new AuthResponseDTO(USER_REGISTERED_MSG);
        when(authService.registerUser(any(SignUpRequestDTO.class))).thenReturn(response);

        String json = createSignUpRequest(EMAIL, "Password123!", FIRST_NAME, LAST_NAME);

        mockMvc.perform(post("/api/auth/signup")
            .contentType(MediaType.APPLICATION_JSON)
            .content(json))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value(USER_REGISTERED_MSG));
    }

    @Test
    public void authenticateUser_returnsOk() throws Exception {
        AuthResponseDTO response = new AuthResponseDTO("jwt-token", "Authenticated!");
        when(authService.authenticateUser(any(LoginRequestDTO.class))).thenReturn(response);

        String json = createLoginRequest(EMAIL, "Password123!");

        mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(json))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Authenticated!"))
            .andExpect(jsonPath("$.jwt").value("jwt-token"));
    }

    @Test
    public void verifyEmail_returnsOk() throws Exception {
        mockMvc.perform(get("/api/auth/verify")
            .param("token", "sometoken"))
            .andExpect(status().isOk())
            .andExpect(content().string("Email verified successfully"));

        verify(authService).verifyEmail("sometoken");
    }
}