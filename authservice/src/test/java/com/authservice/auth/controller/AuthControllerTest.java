package com.authservice.auth.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

import static com.authservice.auth.TestUtils.*;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.authservice.auth.config.SecurityConfig;
import com.authservice.auth.dto.AuthResponseDTO;
import com.authservice.auth.dto.LoginRequestDTO;
import com.authservice.auth.dto.SignUpRequestDTO;
import com.authservice.auth.dto.UserResponseDTO;
import com.authservice.auth.exception.EmailAlreadyExistsException;
import com.authservice.auth.exception.EmailSendException;
import com.authservice.auth.exception.EmailVerificationException;
import com.authservice.auth.exception.InvalidTokenException;
import com.authservice.auth.exception.TooManyRequestsException;
import com.authservice.auth.exception.UserNotFoundException;
import com.authservice.auth.service.AuthService;

@WebMvcTest(AuthController.class)
@Import(SecurityConfig.class)
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

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
    public void registerUser_validRequest_returnsOk() throws Exception {
        AuthResponseDTO response = new AuthResponseDTO(USER_REGISTERED_MSG);
        when(authService.registerUser(any(SignUpRequestDTO.class))).thenReturn(response);

        String json = createSignUpRequestJson(EMAIL, PASSWORD, FIRST_NAME, LAST_NAME);

        mockMvc.perform(post("/api/auth/signup")
            .contentType(MediaType.APPLICATION_JSON)
            .content(json))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value(USER_REGISTERED_MSG));
    }

    @Test
    public void registerUser_emailAlreadyExists_returns409() throws Exception {
        when(authService.registerUser(any(SignUpRequestDTO.class)))
            .thenThrow(new EmailAlreadyExistsException());

        String json = createSignUpRequestJson(EMAIL, PASSWORD, FIRST_NAME, LAST_NAME);

        mockMvc.perform(post("/api/auth/signup")
            .contentType(MediaType.APPLICATION_JSON)
            .content(json))
            .andExpect(status().isConflict());
    }

    @Test
    public void registerUser_mailServerError_returns500() throws Exception {
        when(authService.registerUser(any(SignUpRequestDTO.class)))
            .thenThrow(new EmailSendException());

        String json = createSignUpRequestJson(EMAIL, PASSWORD, FIRST_NAME, LAST_NAME);

        mockMvc.perform(post("/api/auth/signup")
            .contentType(MediaType.APPLICATION_JSON)
            .content(json))
            .andExpect(status().isInternalServerError());
    }

    @Test
    public void authenticateUser_validRequest_returnsOk() throws Exception {
        AuthResponseDTO response = new AuthResponseDTO(TOKEN, USER_AUTHENTICATED_MSG);
        when(authService.authenticateUser(any(LoginRequestDTO.class))).thenReturn(response);

        String json = createLoginRequestJson(EMAIL, PASSWORD);

        mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(json))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value(USER_AUTHENTICATED_MSG))
            .andExpect(jsonPath("$.jwt").value(TOKEN));
    }

    @Test
    public void authenticateUser_incorrectCredentials_returns400() throws Exception {
        when(authService.authenticateUser(any(LoginRequestDTO.class)))
            .thenThrow(new IllegalArgumentException("Email or password is incorrect - please try again"));

        String json = createLoginRequestJson(EMAIL, WRONG_PASSWORD);

        mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(json))
            .andExpect(status().isBadRequest());
    }

    @Test
    public void authenticateUser_unverifiedEmail_returns403() throws Exception {
        when(authService.authenticateUser(any(LoginRequestDTO.class)))
            .thenThrow(new EmailVerificationException());

        String json = createLoginRequestJson(EMAIL, PASSWORD);

        mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(json))
            .andExpect(status().isForbidden());
    }

    @Test
    public void verifyEmail_validRequest_returnsOk() throws Exception {
        mockMvc.perform(get("/api/auth/verify")
            .param("token", TOKEN))
            .andExpect(status().isOk())
            .andExpect(content().string("Email verified successfully"));

        verify(authService).verifyEmail(TOKEN);
    }

    @Test
    public void verifyEmail_userDoesNotExist_returns404() throws Exception {
        doThrow(new UserNotFoundException())
            .when(authService).verifyEmail(TOKEN);

        mockMvc.perform(get("/api/auth/verify")
            .param("token", TOKEN))
            .andExpect(status().isNotFound());
    }

    @Test
    public void verifyEmail_missingToken_returns400() throws Exception {
        mockMvc.perform(get("/api/auth/verify"))
            .andExpect(status().isBadRequest());
    }

    @Test
    public void verifyEmail_invalidToken_returns401() throws Exception {
        doThrow(new InvalidTokenException("Invalid or expired token"))
            .when(authService).verifyEmail(TOKEN);

        mockMvc.perform(get("/api/auth/verify")
            .param("token", TOKEN))
            .andExpect(status().isUnauthorized());
    }

    @Test
    public void resendVerificationEmail_validRequest_returnsOk() throws Exception {
        String json = createEmailRequestJson(EMAIL);

        mockMvc.perform(post("/api/auth/resend-verification")
            .contentType(MediaType.APPLICATION_JSON)
            .content(json))
            .andExpect(status().isOk())
            .andExpect(content().string("Verification email resent"));

        verify(authService).resendVerificationEmail(any());
    }

    @Test
    public void resendVerificationEmail_missingEmail_returns400() throws Exception {
        doThrow(new IllegalArgumentException("Email must be provided"))
            .when(authService).resendVerificationEmail(any());

        String json = createEmailRequestJson("");

        mockMvc.perform(post("/api/auth/resend-verification")
            .contentType(MediaType.APPLICATION_JSON)
            .content(json))
            .andExpect(status().isBadRequest());
    }

    @Test
    public void resendVerificationEmail_userDoesNotExist_returns404() throws Exception {
        doThrow(new UserNotFoundException())
            .when(authService).resendVerificationEmail(any());

        String json = createEmailRequestJson(EMAIL);

        mockMvc.perform(post("/api/auth/resend-verification")
            .contentType(MediaType.APPLICATION_JSON)
            .content(json))
            .andExpect(status().isNotFound());
    }

    @Test
    public void resendVerificationEmail_mailServerError_returns500() throws Exception {
        doThrow(new EmailSendException())
            .when(authService).resendVerificationEmail(any());

        String json = createEmailRequestJson(EMAIL);

        mockMvc.perform(post("/api/auth/resend-verification")
            .contentType(MediaType.APPLICATION_JSON)
            .content(json))
            .andExpect(status().isInternalServerError());
    }

    @Test
    public void resendVerificationEmail_alreadyVerified_returns400() throws Exception {
        doThrow(new IllegalArgumentException("Email already verified - please log in"))
            .when(authService).resendVerificationEmail(any());

        String json = createEmailRequestJson(EMAIL);

        mockMvc.perform(post("/api/auth/resend-verification")
            .contentType(MediaType.APPLICATION_JSON)
            .content(json))
            .andExpect(status().isBadRequest());
    }

    @Test
    public void resendVerificationEmail_rateLimitExceeded_returns429() throws Exception {
        doThrow(new TooManyRequestsException("Too many requests"))
            .when(authService).resendVerificationEmail(any());

        String json = createEmailRequestJson(EMAIL);

        mockMvc.perform(post("/api/auth/resend-verification")
            .contentType(MediaType.APPLICATION_JSON)
            .content(json))
            .andExpect(status().isTooManyRequests());
    }

    @Test
    public void sendPasswordResetEmail_validRequest_returnsOk() throws Exception {
        String json = createEmailRequestJson(EMAIL);

        mockMvc.perform(post("/api/auth/send-reset-email")
            .contentType(MediaType.APPLICATION_JSON)
            .content(json))
            .andExpect(status().isOk())
            .andExpect(content().string("Password reset email sent"));

        verify(authService).sendPasswordResetEmail(any());
    }

    @Test
    public void sendPasswordResetEmail_missingEmail_returns400() throws Exception {
        doThrow(new IllegalArgumentException("Email must be provided"))
            .when(authService).sendPasswordResetEmail(any());

        String json = createEmailRequestJson("");

        mockMvc.perform(post("/api/auth/send-reset-email")
            .contentType(MediaType.APPLICATION_JSON)
            .content(json))
            .andExpect(status().isBadRequest());
    }

    @Test
    public void sendPasswordResetEmail_userDoesNotExist_returns404() throws Exception {
        doThrow(new UserNotFoundException())
            .when(authService).sendPasswordResetEmail(any());

        String json = createEmailRequestJson(EMAIL);

        mockMvc.perform(post("/api/auth/send-reset-email")
            .contentType(MediaType.APPLICATION_JSON)
            .content(json))
            .andExpect(status().isNotFound());
    }

    @Test
    public void sendPasswordResetEmail_rateLimitExceeded_returns429() throws Exception {
        doThrow(new TooManyRequestsException("Too many requests"))
            .when(authService).sendPasswordResetEmail(any());

        String json = createEmailRequestJson(EMAIL);

        mockMvc.perform(post("/api/auth/send-reset-email")
            .contentType(MediaType.APPLICATION_JSON)
            .content(json))
            .andExpect(status().isTooManyRequests());
    }

    @Test
    public void sendPasswordResetEmail_mailServerError_returns500() throws Exception {
        doThrow(new EmailSendException())
            .when(authService).sendPasswordResetEmail(any());

        String json = createEmailRequestJson(EMAIL);

        mockMvc.perform(post("/api/auth/send-reset-email")
            .contentType(MediaType.APPLICATION_JSON)
            .content(json))
            .andExpect(status().isInternalServerError());
    }

    @Test
    public void resetPassword_validRequest_returnsOk() throws Exception {
        String json = createPasswordResetRequestJson(TOKEN, PASSWORD);

        mockMvc.perform(post("/api/auth/reset-password")
            .contentType(MediaType.APPLICATION_JSON)
            .content(json))
            .andExpect(status().isOk())
            .andExpect(content().string("Password changed successfully"));

        verify(authService).resetPassword(any());
    }

    @Test
    public void resetPassword_invalidToken_returns401() throws Exception {
        doThrow(new InvalidTokenException("Invalid or expired token"))
            .when(authService).resetPassword(any());

        String json = createPasswordResetRequestJson(TOKEN, PASSWORD);

        mockMvc.perform(post("/api/auth/reset-password")
            .contentType(MediaType.APPLICATION_JSON)
            .content(json))
            .andExpect(status().isUnauthorized());
    }

    @Test
    public void resetPassword_userDoesNotExist_returns404() throws Exception {
        doThrow(new UserNotFoundException())
            .when(authService).resetPassword(any());

        String json = createPasswordResetRequestJson(TOKEN, PASSWORD);

        mockMvc.perform(post("/api/auth/reset-password")
            .contentType(MediaType.APPLICATION_JSON)
            .content(json))
            .andExpect(status().isNotFound());
    }
}