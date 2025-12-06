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
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.http.MediaType.APPLICATION_JSON;

import static com.authservice.auth.TestUtils.*;

@WebMvcTest(AuthController.class)
public class AuthControllerValidationTest {
    
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    private final String signupUrl = "/api/auth/signup";
    private final String loginUrl = "/api/auth/login";

    @Test
    public void signUp_invalidRequest_returnsBadRequest() throws Exception {
        char[] longName = new char[51];
        for (int i = 0; i < longName.length; i++) {
            longName[i] = 'a';
        }
        String name = new String(longName);
        String body = createSignUpRequestJson("invalid-email", "invalid", name, name);

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

        verifyNoInteractions(authService);
    }

    @Test
    public void signUp_validRequest_returnsOk() throws Exception {
        String body = createSignUpRequestJson(EMAIL, PASSWORD, FIRST_NAME, LAST_NAME);

        when(authService.registerUser(any())).thenReturn(new AuthResponseDTO(USER_REGISTERED_MSG));

        mockMvc.perform(post(signupUrl)
            .contentType(APPLICATION_JSON)
            .content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value(USER_REGISTERED_MSG));
    }

    @Test
    public void login_invalidRequest_returnsBadRequest() throws Exception {
        String body = createLoginRequestJson("invalid-email", "invalid");

        mockMvc.perform(post(loginUrl)
            .contentType(APPLICATION_JSON)
            .content(body))
            .andExpect(status().isBadRequest())
            .andExpect(content().contentTypeCompatibleWith(APPLICATION_JSON))
            .andExpect(jsonPath("$.message", containsString("Invalid email")))
            .andExpect(jsonPath("$.message", containsString("Password must be between")));

        verifyNoInteractions(authService);
    }

    @Test
    public void login_validRequest_returnsOk() throws Exception {
        String body = createLoginRequestJson(EMAIL, PASSWORD);
        User user = new User();
        user.setEmail("email@test.com");
        user.setPassword("encoded");
        user.setVerified(true);

        when(authService.authenticateUser(any()))
            .thenReturn(new AuthResponseDTO("jwt", USER_AUTHENTICATED_MSG));

        mockMvc.perform(post(loginUrl)
            .contentType(APPLICATION_JSON)
            .content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.jwt").value("jwt"))
            .andExpect(jsonPath("$.message").value(USER_AUTHENTICATED_MSG));
    }
}
