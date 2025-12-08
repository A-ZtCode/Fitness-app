import React, { useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Typography,
  Stack,
  CircularProgress,
  Link as MuiLink,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";

const Signup = () => {
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState({
    email: false,
    firstName: false,
    lastName: false,
    password: false,
    confirmPassword: false,
  });

  const inputStyle = (isFocused) => ({
    width: "100%",
    padding: "16px 14px",
    fontSize: "1rem",
    fontFamily: "inherit",
    color: "var(--text-primary)",
    backgroundColor: "var(--bg-elevated)",
    border: isFocused
      ? "2px solid var(--color-primary)"
      : "1px solid var(--border-medium)",
    borderRadius: "var(--radius-sm)",
    outline: "none",
    transition: "all 0.3s ease",
    "&:hover": {
      borderColor: "var(--color-primary)",
    },
    "&:disabled": {
      backgroundColor: "var(--bg-tertiary)",
      opacity: 0.6,
      cursor: "not-allowed",
    },
    "&:-webkit-autofill": {
      WebkitBoxShadow: "0 0 0 1000px var(--bg-elevated) inset !important",
      WebkitTextFillColor: "var(--text-primary) !important",
      transition: "background-color 5000s ease-in-out 0s",
    },
    "&:-webkit-autofill:hover": {
      WebkitBoxShadow: "0 0 0 1000px var(--bg-elevated) inset !important",
    },
    "&:-webkit-autofill:focus": {
      WebkitBoxShadow: "0 0 0 1000px var(--bg-elevated) inset !important",
    },
  });

  const labelStyle = (isFocused, hasValue) => ({
    position: "absolute",
    left: "14px",
    top: isFocused || hasValue ? "-10px" : "16px",
    fontSize: isFocused || hasValue ? "0.75rem" : "1rem",
    fontWeight: isFocused ? 600 : 500,
    color: isFocused ? "var(--color-primary)" : "var(--text-secondary)",
    backgroundColor: "var(--bg-elevated)",
    padding: "0 4px",
    pointerEvents: "none",
    transition: "all 0.2s ease",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setSubmitted(false);
    setSuccess("");
    setError("");
    setFormData({
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      confirmPassword: ""
    });
  };

  const handleResendVerification = async (email) => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:8080/api/auth/resend-verification",
        { email }
      );

      if (response.status === 200) {
        setError("");
        setSuccess("Verification email has been resent");
      }
    } catch (err) {
      setSuccess("");
      setError(
        err.response?.data?.message ||
          "Failed to resend verification email, please try again later"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password,
      };

      const { status, data } = await axios.post(
        "http://localhost:8080/api/auth/signup",
        payload
      );

      if (status === 200) {
        setError("");
        setSuccess(data?.message);
        setSubmitted(true);
      } else {
        setSuccess("");
        setError(data?.message);
      }
    } catch (err) {
      console.error("Error during registration", err);
      setSuccess("");
      setError(
        err.response?.data.message ||
          "An error occurred during registration. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
      }}
    >
      <Box
        sx={{
          maxWidth: 450,
          width: "100%",
          mx: "auto",
          p: 4,
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-lg)",
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--border-light)",
        }}
      >
        {submitted ? (
          <>
            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  backgroundColor: "var(--color-error-bg)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--color-error)",
                  "& .MuiAlert-icon": {
                    color: "var(--color-error)",
                  },
                }}
              >
                {error}
              </Alert>
            )}
            {success && (
              <Alert
                severity="success"
                sx={{
                  mb: 3,
                  backgroundColor: "var(--color-success-bg)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--color-success)",
                  "& .MuiAlert-icon": {
                    color: "var(--color-success)",
                  },
                }}
              >
                {success}
              </Alert>
            )}
            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Typography variant="h6" gutterBottom color="var(--text-primary)">
                Thanks for signing up!
              </Typography>
              <Typography color="var(--text-secondary)">
                We have sent a verification link to: {formData.email}.<br />
                Please check your inbox and click the link to verify your account.
              </Typography>
              <Typography sx={{ mb: 2 }} color="var(--text-secondary)">
                Didn't receive the email?{" "}
                <Button variant="text" disabled={isLoading} onClick={() => handleResendVerification(formData.email)}>
                  {isLoading ? <CircularProgress size={24} color="inherit"/>
                  : "Resend email"}
                </Button>
              </Typography>

              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Button
                  variant="contained"
                  onClick={() => {resetForm()}}
                  sx={{
                    py: 1.5,
                    px: 4,
                    borderRadius: "30px",
                    fontWeight: 700,
                    fontSize: "1rem",
                    textTransform: "none",
                    backgroundColor: "var(--color-primary)",
                    color: "#FFFFFF",
                    boxShadow: "var(--shadow-md)",
                    "&:hover": {
                      backgroundColor: "var(--color-primary-hover)",
                      boxShadow: "var(--shadow-lg)",
                    },
                  }}
                >
                  Back to sign up
                </Button>
              </Box>
            </Box>
          </>
        ) : (
          <>
            <Box sx={{ textAlign: "center", mb: 3 }}>
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  backgroundColor: "var(--color-primary)",
                  mb: 2,
                }}
              >
                <PersonAddOutlinedIcon sx={{ color: "#FFFFFF", fontSize: 28 }} />
              </Box>
              <Typography
                variant="h4"
                component="h1"
                fontWeight={700}
                color="var(--text-primary)"
                gutterBottom
              >
                Sign Up
              </Typography>
            </Box>

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  backgroundColor: "var(--color-error-bg)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--color-error)",
                  "& .MuiAlert-icon": {
                    color: "var(--color-error)",
                  },
                }}
              >
                {error}
              </Alert>
            )}
            {success && (
              <Alert
                severity="success"
                sx={{
                  mb: 3,
                  backgroundColor: "var(--color-success-bg)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--color-success)",
                  "& .MuiAlert-icon": {
                    color: "var(--color-success)",
                  },
                }}
              >
                {success}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSignup} noValidate>
              <Stack spacing={3}>
                {/* Email Field */}
                <Box sx={{ position: "relative" }}>
                  <Box
                    component="label"
                    htmlFor="email"
                    sx={labelStyle(focused.email, formData.email)}
                  >
                    Email Address *
                  </Box>
                  <Box
                    component="input"
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    onFocus={() => setFocused(prev => ({ ...prev, email: true }))}
                    onBlur={() => setFocused(prev => ({ ...prev, email: false }))}
                    disabled={isLoading}
                    sx={inputStyle(focused.email)}
                  />
                </Box>

                {/* First Name Field */}
                <Box sx={{ position: "relative" }}>
                  <Box
                    component="label"
                    htmlFor="firstName"
                    sx={labelStyle(focused.firstName, formData.firstName)}
                  >
                    First Name *
                  </Box>
                  <Box
                    component="input"
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    onFocus={() => setFocused(prev => ({ ...prev, firstName: true }))}
                    onBlur={() => setFocused(prev => ({ ...prev, firstName: false }))}
                    disabled={isLoading}
                    sx={inputStyle(focused.firstName)}
                  />
                </Box>

                {/* Last Name Field */}
                <Box sx={{ position: "relative" }}>
                  <Box
                    component="label"
                    htmlFor="lastName"
                    sx={labelStyle(focused.lastName, formData.lastName)}
                  >
                    Last Name *
                  </Box>
                  <Box
                    component="input"
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    onFocus={() => setFocused(prev => ({ ...prev, lastName: true }))}
                    onBlur={() => setFocused(prev => ({ ...prev, lastName: false }))}
                    disabled={isLoading}
                    sx={inputStyle(focused.lastName)}
                  />
                </Box>

                {/* Password Field */}
                <Box sx={{ position: "relative" }}>
                  <Box
                    component="label"
                    htmlFor="password"
                    sx={labelStyle(focused.password, formData.password)}
                  >
                    Password *
                  </Box>
                  <Box
                    component="input"
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    onFocus={() => setFocused(prev => ({ ...prev, password: true }))}
                    onBlur={() => setFocused(prev => ({ ...prev, password: false }))}
                    disabled={isLoading}
                    sx={inputStyle(focused.password)}
                  />
                </Box>

                {/* Confirm Password Field */}
                <Box sx={{ position: "relative" }}>
                  <Box
                    component="label"
                    htmlFor="confirmPassword"
                    sx={labelStyle(focused.confirmPassword, formData.confirmPassword)}
                  >
                    Confirm Password *
                  </Box>
                  <Box
                    component="input"
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    onFocus={() => setFocused(prev => ({ ...prev, confirmPassword: true }))}
                    onBlur={() => setFocused(prev => ({ ...prev, confirmPassword: false }))}
                    disabled={isLoading}
                    sx={inputStyle(focused.confirmPassword)}
                  />
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={isLoading || !formData.email || !formData.firstName || !formData.lastName || !formData.password || !formData.confirmPassword}
                  sx={{
                    mt: 2,
                    py: 1.5,
                    borderRadius: "30px",
                    fontWeight: 700,
                    fontSize: "1rem",
                    textTransform: "none",
                    backgroundColor: "var(--color-primary)",
                    color: "#FFFFFF",
                    boxShadow: "var(--shadow-md)",
                    transition: "all 0.3s ease",

                    "&.Mui-disabled": {
                      backgroundColor: "var(--border-medium)",
                      color: "var(--text-muted)",
                      opacity: 0.6,
                    },

                    "&:hover": {
                      backgroundColor: "var(--color-primary-hover)",
                      boxShadow: "var(--shadow-lg)",
                      transform: "translateY(-1px)",
                    },

                    "&:active": {
                      transform: "translateY(0)",
                    },
                  }}
                >
                  {isLoading ? <CircularProgress size={24} sx={{ color: "#FFFFFF" }} /> : "Sign Up"}
                </Button>
              </Stack>
            </Box>

            <Box sx={{ mt: 3, textAlign: "center" }}>
              <Typography variant="body2" color="var(--text-secondary)">
                Already have an account?{" "}
                <MuiLink
                  component={RouterLink}
                  to="/login"
                  sx={{
                    color: "var(--color-primary)",
                    textDecoration: "none",
                    fontWeight: 700,
                    "&:hover": {
                      textDecoration: "underline",
                    },
                    "&:focus": {
                      outline: "2px solid var(--color-primary)",
                      outlineOffset: "2px",
                      borderRadius: "4px",
                    },
                  }}
                >
                  Login
                </MuiLink>
              </Typography>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default Signup;
