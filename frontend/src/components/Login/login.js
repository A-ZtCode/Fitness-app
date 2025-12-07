import React, { useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Stack,
  Typography,
  CircularProgress,
  Link as MuiLink,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:8080/api/auth/login",
        { email, password }
      );

      if (response.status === 200) {
        // Store the JWT token for authenticated API calls
        if (response.data.jwt) {
          localStorage.setItem("jwt", response.data.jwt);
        }
        onLogin(email);
        navigate("/trackExercise");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (isFocused) => ({
    width: "100%",
    padding: "16px 14px",
    fontSize: "1rem",
    fontFamily: "inherit",
    color: "var(--text-primary)",
    backgroundColor: "var(--bg-secondary)",
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
      WebkitBoxShadow: "0 0 0 1000px var(--bg-secondary) inset !important",
      WebkitTextFillColor: "var(--text-primary) !important",
      transition: "background-color 5000s ease-in-out 0s",
    },
    "&:-webkit-autofill:hover": {
      WebkitBoxShadow: "0 0 0 1000px var(--bg-secondary) inset !important",
    },
    "&:-webkit-autofill:focus": {
      WebkitBoxShadow: "0 0 0 1000px var(--bg-secondary) inset !important",
    },
  });

  const labelStyle = (isFocused, hasValue) => ({
    position: "absolute",
    left: "14px",
    top: isFocused || hasValue ? "-10px" : "16px",
    fontSize: isFocused || hasValue ? "0.75rem" : "1rem",
    fontWeight: isFocused ? 600 : 500,
    color: isFocused ? "var(--color-primary)" : "var(--text-secondary)",
    backgroundColor: "var(--bg-secondary)",
    padding: "0 4px",
    pointerEvents: "none",
    transition: "all 0.2s ease",
  });

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
            <LockOutlinedIcon sx={{ color: "#FFFFFF", fontSize: 28 }} />
          </Box>
          <Typography
            variant="h4"
            component="h1"
            fontWeight={700}
            color="var(--text-primary)"
            gutterBottom
          >
            Login
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

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={3}>
            {/* Email Field */}
            <Box sx={{ position: "relative" }}>
              <Box
                component="label"
                htmlFor="email"
                sx={labelStyle(emailFocused, email)}
              >
                Email Address *
              </Box>
              <Box
                component="input"
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                autoFocus
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                disabled={loading}
                sx={inputStyle(emailFocused)}
              />
            </Box>

            {/* Password Field */}
            <Box sx={{ position: "relative" }}>
              <Box
                component="label"
                htmlFor="password"
                sx={labelStyle(passwordFocused, password)}
              >
                Password *
              </Box>
              <Box
                component="input"
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                disabled={loading}
                sx={inputStyle(passwordFocused)}
              />
            </Box>

            <Box sx={{ textAlign: "right" }}>
              <MuiLink
                component={RouterLink}
                to="/forgot-password"
                sx={{
                  color: "var(--color-primary)",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: "0.875rem",
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
                Forgot password?
              </MuiLink>
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading || !email || !password}
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
              {loading ? (
                <CircularProgress size={24} sx={{ color: "#FFFFFF" }} />
              ) : (
                "Login"
              )}
            </Button>
          </Stack>
        </Box>

        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography variant="body2" color="var(--text-secondary)">
            Don't have an account?{" "}
            <MuiLink
              component={RouterLink}
              to="/signup"
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
              Sign up
            </MuiLink>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
