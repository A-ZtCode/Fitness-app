package com.authservice.auth.dto;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

public class LoginRequestDTO {
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Size(max = 254)
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
