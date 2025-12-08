import React, { useEffect, useState } from "react";
import axios from "axios";
import { Box, Typography, Button, CircularProgress, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTheme, themes } from "../../contexts/ThemeContext.js";

const Verify = () => {
  const [status, setStatus] = useState(""); // verifying | success | error
  const [message, setMessage] = useState("");
  const [token, setToken] = useState(null);
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const themeColors = themes[currentTheme]?.colors || themes.light.colors;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailToken = params.get("token");
    if (!emailToken) {
      setStatus("error");
      setMessage("No verification token provided");
      return;
    }
    setToken(emailToken);
  }, []);

  const handleVerify = async () => {
    if (!token) return;
    setStatus("verifying");
    setMessage("");

    try {
      await axios.get(`http://localhost:8080/api/auth/verify?token=${encodeURIComponent(token)}`);
      setStatus("success");
      setMessage("Email verified successfully! Please log in.");
    } catch (err) {
      setStatus("error");
      setMessage("Verification failed: " + 
          (err.response?.data?.message || "Something went wrong. Please try again."));
    }
  }


  if (status === "verifying") {
    return (
      <Box sx={{ textAlign: "center" }}>
        <CircularProgress sx={{ color: "var(--color-primary)" }} />
        <Typography sx={{ mt: 2, color: themeColors["text-primary"] }}>
          Verifying your email...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ textAlign: "center" }}>
      {status === "success" ? (
        <>
          <Alert
            severity="success"
            sx={{
              mb: 2,
              backgroundColor: "var(--color-success-bg)",
              color: "var(--text-primary)",
              border: "1px solid var(--color-success)",
              "& .MuiAlert-icon": {
                color: "var(--color-success)",
              },
            }}
          >
            {message}
          </Alert>
          <Button
            variant="contained"
            onClick={() => navigate("/login")}
            sx={{
              backgroundColor: "var(--color-primary)",
              color: "#FFFFFF",
              "&:hover": {
                backgroundColor: "var(--color-primary-hover)",
              },
            }}
          >
            Go to login
          </Button>
        </>
      ) : status === "error" && !token ? (
        <>
          <Alert
            severity="error"
            sx={{
              mb: 2,
              backgroundColor: "var(--color-error-bg)",
              color: "var(--text-primary)",
              border: "1px solid var(--color-error)",
              "& .MuiAlert-icon": {
                color: "var(--color-error)",
              },
            }}
          >
            {message}
          </Alert>
          <Button
            variant="contained"
            onClick={() => navigate("/signup")}
            sx={{
              backgroundColor: "var(--color-primary)",
              color: "#FFFFFF",
              "&:hover": {
                backgroundColor: "var(--color-primary-hover)",
              },
            }}
          >
            Back to signup
          </Button>
        </>
      ) : (
        <>
          {status === "error" && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                backgroundColor: "var(--color-error-bg)",
                color: "var(--text-primary)",
                border: "1px solid var(--color-error)",
                "& .MuiAlert-icon": {
                  color: "var(--color-error)",
                },
              }}
            >
              {message}
            </Alert>
          )}
          <Typography sx={{ mb: 2, color: themeColors["text-primary"] }}>
            Click the button below to verify your email.
          </Typography>
          <Button
            variant="contained"
            onClick={handleVerify}
            disabled={!token || status === "verifying"}
            sx={{
              backgroundColor: "var(--color-primary)",
              color: "#FFFFFF",
              "&:hover": {
                backgroundColor: "var(--color-primary-hover)",
              },
              "&.Mui-disabled": {
                backgroundColor: "var(--border-medium)",
                color: "var(--text-muted)",
              },
            }}
          >
            Verify email
          </Button>
        </>
      )}
    </Box>
  );
};

export default Verify;