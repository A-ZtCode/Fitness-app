import React, { useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const loginResponse = await axios.post(
        "http://localhost:8080/api/auth/login",
        {
          email: formData.email,
          password: formData.password,
        }
      );

      if (loginResponse.status === 200) {
        const { data: userData } = await axios.get(
          `http://localhost:8080/api/auth/user?email=${encodeURIComponent(
            formData.email
          )}`
        );

        localStorage.setItem("user", JSON.stringify(userData));

        if (onLogin) onLogin(userData.email);
        navigate("/statistics");
      }
    } catch (err) {
      console.error("Login failed:", err);
      if (err.response && err.response.status === 401) {
        setError("Username or password is incorrect – please try again.");
      } else {
        setError(err.response?.data || "Failed to login. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleLogin}
      noValidate
      sx={{
        mt: 1,
        maxWidth: 420,
        mx: "auto",
        p: 4,
        borderRadius: 4,
        boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
        backgroundColor: "white",
      }}
    >
      <Typography
        variant="h5"
        align="center"
        fontWeight={600}
        mb={3}
        color="text.primary"
      >
        Login
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={2.5}>
        <TextField
          label="Email"
          name="email"
          type="email"
          variant="standard"
          fullWidth
          required
          value={formData.email}
          onChange={handleChange}
        />

        <TextField
          label="Password"
          name="password"
          type="password"
          variant="standard"
          fullWidth
          required
          value={formData.password}
          onChange={handleChange}
        />

        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          sx={{
            mt: 2,
            backgroundColor: "var(--color-primary)",
            "&:hover": {
              backgroundColor: "var(--color-primary-600)",
            },
            py: 1.2,
            fontWeight: "bold",
            borderRadius: "30px",
            transition: "background-color 0.3s ease",
          }}
        >
          {loading ? <CircularProgress size={24} /> : "Login"}
        </Button>
      </Stack>

      <Typography sx={{ mt: 2, textAlign: "center" }}>
        Don't have an account?{" "}
        <Button
          component={RouterLink}
          to="/signup"
          variant="text"
          sx={{
            textTransform: "none",
            color: "var(--color-primary)",
            fontWeight: 600,
          }}
        >
          Sign up
        </Button>
      </Typography>
    </Box>
  );
};

export default Login;
