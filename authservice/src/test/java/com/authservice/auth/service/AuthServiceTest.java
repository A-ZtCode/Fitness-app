package com.authservice.auth.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import static com.authservice.auth.TestUtils.*;

import java.time.Instant;
import java.util.Collections;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.authservice.auth.dto.AuthResponseDTO;
import com.authservice.auth.dto.LoginRequestDTO;
import com.authservice.auth.dto.PasswordResetDTO;
import com.authservice.auth.dto.SignUpRequestDTO;
import com.authservice.auth.dto.UpdateUserRequestDTO;
import com.authservice.auth.dto.UserResponseDTO;
import com.authservice.auth.exception.EmailAlreadyExistsException;
import com.authservice.auth.exception.InvalidCredentialsException;
import com.authservice.auth.exception.InvalidTokenException;
import com.authservice.auth.exception.TooManyRequestsException;
import com.authservice.auth.exception.UserNotFoundException;
import com.authservice.auth.model.User;
import com.authservice.auth.repository.UserRepository;

public class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock 
    private EmailService emailService;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
        when(jwtService.createUserToken(any(String.class))).thenReturn(TOKEN);
    }

    /* TESTS FOR SIGN UP */

    @Test
    public void registerUser_whenEmailDoesNotExist_registersUser() {
        SignUpRequestDTO request = createSignUpRequestDto(EMAIL, PASSWORD);

        when(userRepository.existsByEmail(EMAIL))
            .thenReturn(false);
        when(passwordEncoder.encode(PASSWORD))
            .thenReturn(ENCODED_PASSWORD);

        AuthResponseDTO response = authService.registerUser(request);
        verify(userRepository).existsByEmail(EMAIL);

        assertEquals(USER_REGISTERED_MSG, response.getMessage());

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(2)).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();

        assertEquals(ENCODED_PASSWORD, savedUser.getPassword());
        assertEquals(EMAIL, savedUser.getEmail());
        assertEquals(FIRST_NAME, savedUser.getFirstName());
        assertEquals(LAST_NAME, savedUser.getLastName());
    }

    @Test
    public void registerUser_whenEmailExists_throwsEmailAlreadyExistsException() {
        SignUpRequestDTO request = createSignUpRequestDto(EMAIL, PASSWORD);

        when(userRepository.existsByEmail(EMAIL))
            .thenReturn(true);

        assertThrows(EmailAlreadyExistsException.class, () -> {
            authService.registerUser(request);
        });

        verify(userRepository, never()).save(any(User.class));
    }


    /* TESTS FOR LOGIN */

    @Test
    public void authenticateUser_whenEmailDoesNotExist_throwInvalidCredentialsException() {
        LoginRequestDTO request = createLoginRequestDto(EMAIL, PASSWORD);

        when(userRepository.findByEmail(EMAIL))
            .thenReturn(null);

        assertThrows(InvalidCredentialsException.class, () -> {
            authService.authenticateUser(request);
        });
    }

    @Test
    public void authenticateUser_whenEmailAndPasswordCorrect_authenticatesUser() {
        LoginRequestDTO request = createLoginRequestDto(EMAIL, PASSWORD);
        User existingUser = createUser(EMAIL, ENCODED_PASSWORD, FIRST_NAME, LAST_NAME);
        existingUser.setVerified(true);

        when(userRepository.findByEmail(EMAIL))
            .thenReturn(existingUser);
        when(passwordEncoder.matches(PASSWORD, ENCODED_PASSWORD))
            .thenReturn(true);

        AuthResponseDTO response = authService.authenticateUser(request);
        verify(userRepository).findByEmail(EMAIL);

        assertEquals(USER_AUTHENTICATED_MSG, response.getMessage());
        assertEquals(TOKEN, response.getJwt());
    }

    @Test
    public void authenticateUser_whenEmailCorrectPasswordIncorrect_throwInvalidCredentialsException() {
        LoginRequestDTO request = createLoginRequestDto(EMAIL, WRONG_PASSWORD);
        User existingUser = createUser(EMAIL, ENCODED_PASSWORD, FIRST_NAME, LAST_NAME);
        existingUser.setVerified(true);

        when(userRepository.findByEmail(EMAIL))
            .thenReturn(existingUser);
        when(passwordEncoder.matches(WRONG_PASSWORD, ENCODED_PASSWORD))
            .thenReturn(false);

        assertThrows(InvalidCredentialsException.class, () -> {
            authService.authenticateUser(request);
        });
    }


    /* TESTS FOR GET/PATCH USER */

    @Test
    public void getUserByEmail_whenUserExists_returnsUser() {
        User user = createUser(EMAIL, PASSWORD, FIRST_NAME, LAST_NAME);

        when(userRepository.findByEmail(EMAIL))
            .thenReturn(user);

        UserResponseDTO response = authService.getUserByEmail(EMAIL);
        verify(userRepository).findByEmail(EMAIL);

        assertEquals(user.getId(), response.getId());
        assertEquals(user.getEmail(), response.getEmail());
        assertEquals(user.getFirstName(), response.getFirstName());
        assertEquals(user.getLastName(), response.getLastName());
    }

    @Test
    public void getUserByEmail_whenUserDoesNotExist_throwUserNotFoundException() {
        when(userRepository.findByEmail(EMAIL))
            .thenReturn(null);

        assertThrows(UserNotFoundException.class, () -> {
            authService.getUserByEmail(EMAIL);
        });
    }

    @Test
    public void getUserByEmail_whenEmailIsNull_throwIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class, () -> {
            authService.getUserByEmail(null);
        });
    }

    @Test
    public void getUserById_whenUserExists_returnsUser() {
        User user = createUser(EMAIL, PASSWORD, FIRST_NAME, LAST_NAME);
        when(userRepository.findById(user.getId()))
            .thenReturn(Optional.of(user));

        UserResponseDTO response = authService.getUserById(user.getId());
        verify(userRepository).findById(user.getId());

        assertEquals(user.getId(), response.getId());
        assertEquals(user.getEmail(), response.getEmail());
        assertEquals(user.getFirstName(), response.getFirstName());
        assertEquals(user.getLastName(), response.getLastName());
    }

    @Test
    public void getUserById_whenUserDoesNotExist_throwUserNotFoundException() {    
        when(userRepository.findById(USER_ID))
            .thenReturn(Optional.empty());

        assertThrows(UserNotFoundException.class, () -> {
            authService.getUserById(USER_ID);
        });
    }

    @Test
    public void getUserById_whenIdIsNull_throwIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class, () -> {
            authService.getUserById(null);
        });
    }

    @Test
    public void updateUserDetails_whenUserDoesNotExist_throwUserNotFoundException() {
        UpdateUserRequestDTO updateRequest = new UpdateUserRequestDTO();
        updateRequest.setFirstName("NewFirstName");

        when(userRepository.findById(USER_ID))
            .thenReturn(Optional.empty());

        assertThrows(UserNotFoundException.class, () -> {
            authService.updateUserDetails(USER_ID, updateRequest);
        });
    }

    @Test
    public void updateUserDetails_whenUserExists_updatesUser() {
        User user = createUser(EMAIL, PASSWORD, FIRST_NAME, LAST_NAME);
        UpdateUserRequestDTO updateRequest = new UpdateUserRequestDTO();
        updateRequest.setFirstName("NewFirstName");
        updateRequest.setLastName("NewLastName");

        when(userRepository.findById(USER_ID))
            .thenReturn(Optional.of(user));

        authService.updateUserDetails(USER_ID, updateRequest);
        verify(userRepository).findById(USER_ID);

        verify(userRepository).save(user);
        assertEquals("NewFirstName", user.getFirstName());
        assertEquals("NewLastName", user.getLastName());
        assertEquals(USER_ID, user.getId());
        assertEquals(EMAIL, user.getEmail());
        assertEquals(PASSWORD, user.getPassword());
    }


    /* TESTS FOR VERIFY EMAIL */

    @Test
    public void verifyEmail_whenTokenIsExpired_throwsInvalidTokenException() {
        String expiredToken = "expired";
        when(emailService.extractUserIdFromToken(expiredToken))
            .thenThrow(new InvalidTokenException("Invalid or expired token"));

        assertThrows(
            InvalidTokenException.class, 
            () -> authService.verifyEmail(expiredToken)
        );
    }

    @Test
    public void verifyEmail_whenValidToken_verifiesUser() {
        when(emailService.extractUserIdFromToken(TOKEN)).thenReturn(USER_ID);

        User user = createUser(EMAIL, PASSWORD, FIRST_NAME, LAST_NAME);
        user.setId(USER_ID);

        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

        authService.verifyEmail(TOKEN);
        verify(emailService).extractUserIdFromToken(TOKEN);
        verify(userRepository).findById(USER_ID);
        verify(userRepository).save(user);

        assertTrue(user.isVerified());
    }

    @Test
    public void resendVerificationEmail_whenRequestTooSoon_throwTooManyRequestsException() {
        User user = createUser(EMAIL, PASSWORD, FIRST_NAME, LAST_NAME);
        user.setVerificationEmailSentAt(Instant.now());

        when(userRepository.findByEmail(EMAIL)).thenReturn(user);

        assertThrows(TooManyRequestsException.class, () -> {
            authService.resendVerificationEmail(Collections.singletonMap("email", EMAIL));
        });
    }

    @Test
    public void resendVerificationEmail_whenValidRequest_resendsEmail() {
        User user = createUser(EMAIL, PASSWORD, FIRST_NAME, LAST_NAME);
        user.setVerificationEmailSentAt(Instant.now().minusSeconds(120));

        when(userRepository.findByEmail(EMAIL)).thenReturn(user);

        authService.resendVerificationEmail(Collections.singletonMap("email", EMAIL));

        verify(userRepository).findByEmail(EMAIL);
        verify(emailService).sendVerificationEmail(user);
        assertTrue(user.getVerificationEmailSentAt().isAfter(Instant.now().minusSeconds(60)));
        verify(userRepository).save(user);
    }


    /* TESTS FOR PASSWORD RESET */

    @Test
    public void sendPasswordResetEmail_whenEmailExists_sendsEmail() {
        User user = createUser(EMAIL, PASSWORD, FIRST_NAME, LAST_NAME);

        when(userRepository.findByEmail(EMAIL)).thenReturn(user);

        authService.sendPasswordResetEmail(Collections.singletonMap("email", EMAIL));

        verify(userRepository).findByEmail(EMAIL);
        verify(emailService).sendPasswordResetEmail(user);
        assertTrue(user.getPasswordResetEmailSentAt().isAfter(Instant.now().minusSeconds(60)));
        verify(userRepository).save(user);
    }

    @Test
    public void sendPasswordResetEmail_whenEmailDoesNotExist_throwsUserNotFoundException() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(null);

        assertThrows(UserNotFoundException.class, () -> {
            authService.sendPasswordResetEmail(Collections.singletonMap("email", EMAIL));
        });
    }

    @Test
    public void sendPasswordResetEmail_whenRequestTooSoon_throwsTooManyRequestsException() {
        User user = createUser(EMAIL, PASSWORD, FIRST_NAME, LAST_NAME);
        user.setPasswordResetEmailSentAt(Instant.now());

        when(userRepository.findByEmail(EMAIL)).thenReturn(user);

        assertThrows(TooManyRequestsException.class, () -> {
            authService.sendPasswordResetEmail(Collections.singletonMap("email", EMAIL));
        });
    }

    @Test
    public void resetPassword_whenValidRequest_resetsPassword() {
        when(emailService.extractUserIdFromToken(TOKEN)).thenReturn(USER_ID);

        User user = createUser(EMAIL, PASSWORD, FIRST_NAME, LAST_NAME);
        user.setId(USER_ID);

        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

        PasswordResetDTO request = new PasswordResetDTO();
        request.setToken(TOKEN);
        request.setNewPassword("NewValidPassword123!");

        when(passwordEncoder.encode("NewValidPassword123!"))
            .thenReturn("NewValidPassword123!");

        authService.resetPassword(request);

        verify(emailService).extractUserIdFromToken(TOKEN);
        verify(userRepository).findById(USER_ID);
        verify(userRepository).save(user);

        assertEquals("NewValidPassword123!", user.getPassword());
    }

    @Test
    public void resetPassword_whenUserDoesNotExist_throwsUserNotFoundException() {
        when(emailService.extractUserIdFromToken(TOKEN)).thenReturn(USER_ID);

        when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

        PasswordResetDTO request = new PasswordResetDTO();
        request.setToken(TOKEN);
        request.setNewPassword(PASSWORD);

        assertThrows(UserNotFoundException.class, () -> {
            authService.resetPassword(request);
        });
    }

    @Test
    public void resetPassword_whenTokenIsExpired_throwsInvalidTokenException() {
        String expiredToken = "expired";
        when(emailService.extractUserIdFromToken(expiredToken))
            .thenThrow(new InvalidTokenException("Invalid or expired token"));

        PasswordResetDTO request = new PasswordResetDTO();
        request.setToken(expiredToken);
        request.setNewPassword(PASSWORD);

        assertThrows(
            InvalidTokenException.class, 
            () -> authService.resetPassword(request)
        );
    }
}
