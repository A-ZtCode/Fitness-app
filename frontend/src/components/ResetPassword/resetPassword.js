import { useState, useEffect } from "react";
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
import {
  Link as RouterLink,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import LockResetIcon from "@mui/icons-material/LockReset";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [tokenValid, setTokenValid] = useState(true);
  const [focused, setFocused] = useState({
    password: false,
    confirmPassword: false,
  });
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setError("Invalid or missing reset token");
    }
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:8080/api/auth/reset-password",
        {
          token,
          newPassword: formData.password,
        }
      );

      if (response.status === 200) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to reset password. The link may have expired."
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

  if (!tokenValid) {
    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 4,
          px: 2,
          boxSizing: "border-box",
        }}
      >
        <Box
          sx={{
            maxWidth: 450,
            width: "100%",
            mx: "auto",
            p: { xs: 3, sm: 4 },
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-lg)",
            backgroundColor: "var(--bg-elevated)",
            border: "1px solid var(--border-light)",
            boxSizing: "border-box",
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
                backgroundColor: "var(--color-error)",
                mb: 2,
              }}
            >
              <LockResetIcon sx={{ color: "#FFFFFF", fontSize: 28 }} />
            </Box>
            <Typography
              variant="h4"
              component="h1"
              fontWeight={700}
              color="var(--text-primary)"
              gutterBottom
            >
              Invalid Link
            </Typography>
          </Box>

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
            Invalid or missing reset token. Please request a new password reset.
          </Alert>

          <Button
            component={RouterLink}
            to="/forgoten-password"
            variant="contained"
            fullWidth
            sx={{
              py: 1.5,
              borderRadius: "30px",
              fontWeight: 700,
              fontSize: "1rem",
              textTransform: "none",
              backgroundColor: "var(--color-primary)",
              color: "#FFFFFF",
              boxShadow: "var(--shadow-md)",
              transition: "all 0.3s ease",
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
            Request New Reset Link
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
        px: 2,
        boxSizing: "border-box",
      }}
    >
      <Box
        sx={{
          maxWidth: 450,
          width: "100%",
          mx: "auto",
          p: { xs: 3, sm: 4 },
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-lg)",
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--border-light)",
          boxSizing: "border-box",
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
            <LockResetIcon sx={{ color: "#FFFFFF", fontSize: 28 }} />
          </Box>
          <Typography
            variant="h4"
            component="h1"
            fontWeight={700}
            color="var(--text-primary)"
            gutterBottom
          >
            Reset Password
          </Typography>
          <Typography variant="body2" color="var(--text-secondary)">
            Enter your new password below.
          </Typography>
        </Box>

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
            Password reset successful! Redirecting to login...
          </Alert>
        )}

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
            {/* Password Field */}
            <Box sx={{ position: "relative" }}>
              <Box
                component="label"
                htmlFor="password"
                sx={labelStyle(focused.password, formData.password)}
              >
                New Password *
              </Box>
              <Box
                component="input"
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                autoFocus
                required
                value={formData.password}
                onChange={handleChange}
                onFocus={() =>
                  setFocused((prev) => ({ ...prev, password: true }))
                }
                onBlur={() =>
                  setFocused((prev) => ({ ...prev, password: false }))
                }
                disabled={loading || success}
                sx={inputStyle(focused.password)}
              />
            </Box>

            {/* Confirm Password Field */}
            <Box sx={{ position: "relative" }}>
              <Box
                component="label"
                htmlFor="confirmPassword"
                sx={labelStyle(
                  focused.confirmPassword,
                  formData.confirmPassword
                )}
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
                onChange={handleChange}
                onFocus={() =>
                  setFocused((prev) => ({ ...prev, confirmPassword: true }))
                }
                onBlur={() =>
                  setFocused((prev) => ({ ...prev, confirmPassword: false }))
                }
                disabled={loading || success}
                sx={inputStyle(focused.confirmPassword)}
              />
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={
                loading ||
                success ||
                !formData.password ||
                !formData.confirmPassword
              }
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
                "Reset Password"
              )}
            </Button>
          </Stack>
        </Box>

        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography variant="body2" color="var(--text-secondary)">
            Remember your password?{" "}
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
      </Box>
    </Box>
  );
};

export default ResetPassword;
