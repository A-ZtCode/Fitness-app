import React, { useState, useEffect } from "react";
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

const Settings = ({ userEmail }) => {
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);

        const response = await axios.get(
          `http://localhost:8080/api/user?email=${userEmail}`
        );
        const data = response.data;

        setFormData({
          email: data.email || "",
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          password: "",
        });
      } catch (err) {
        console.error("Error fetching user:", err);
        setError(
          err.response?.data || "Failed to load user data. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    if (userEmail) {
      fetchUser();
    } else {
      const localUser = JSON.parse(localStorage.getItem("user"));
      if (localUser) {
        setFormData({
          email: localUser.email || "",
          firstName: localUser.firstName || "",
          lastName: localUser.lastName || "",
          password: "",
        });
      }
      setLoading(false);
    }
  }, [userEmail]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleEdit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (isEditing) {
      try {
        const payload = {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          password: formData.password,
        };

        const { data } = await axios.put(
          "http://localhost:8080/api/user/update",
          payload
        );

        if (data === "User updated successfully!") {
          setSuccess("Profile updated successfully!");
        } else {
          setError(data);
        }
      } catch (err) {
        console.error("Error updating user:", err);
        setError(
          err.response?.data ||
            "An error occurred while saving changes. Please try again."
        );
      }
    }

    setIsEditing((prev) => !prev);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      component="form"
      onSubmit={handleToggleEdit}
      noValidate
      sx={{
        mt: 4,
        maxWidth: 420,
        mx: "auto",
        p: 4,
        backgroundColor: isEditing ? "#fff5f5" : "white",
        borderRadius: 4,
        boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
        transition: "background-color 0.3s ease",
      }}
    >
      <Typography
        variant="h5"
        align="center"
        fontWeight={600}
        mb={3}
        color={isEditing ? "error.main" : "text.primary"}
      >
        Personal Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Stack spacing={2.5}>
        {["email", "firstName", "lastName", "password"].map((field) => (
          <TextField
            key={field}
            label={
              field === "password"
                ? "New Password"
                : field.charAt(0).toUpperCase() + field.slice(1)
            }
            variant="standard"
            fullWidth
            name={field}
            type={field === "password" ? "password" : "text"}
            value={formData[field]}
            onChange={handleInputChange}
            InputProps={{
              readOnly: !isEditing,
            }}
            sx={{
              "& .MuiInput-underline:before": {
                borderBottomColor: isEditing ? "#f44336" : "#ccc",
              },
              "& .MuiInput-underline:after": {
                borderBottomColor: isEditing ? "#f44336" : "#1976d2",
              },
              "& .MuiFormLabel-root": {
                color: isEditing ? "#f44336" : "rgba(0,0,0,0.6)",
              },
              "& .MuiInputBase-input.Mui-disabled": {
                WebkitTextFillColor: "rgba(0,0,0,0.87)",
              },
              "&:hover .MuiInput-underline:before": {
                borderBottomColor: isEditing ? "#e53935" : "#000",
              },
            }}
          />
        ))}

        <Button
          type="submit"
          variant="contained"
          sx={{
            mt: 3,
            borderRadius: "30px",
            py: 1.5,
            backgroundColor: isEditing ? "#d32f2f" : "var(--color-primary)",
            fontWeight: "bold",
            "&:hover": {
              backgroundColor: isEditing
                ? "#b71c1c"
                : "var(--color-primary-600)",
            },
            transition: "background-color 0.3s ease",
          }}
        >
          {isEditing ? "Save" : "Edit"}
        </Button>
      </Stack>
    </Box>
  );
};

export default Settings;
