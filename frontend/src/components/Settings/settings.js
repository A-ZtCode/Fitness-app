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
  Snackbar,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const Settings = ({ userEmail, onLogout }) => {
  const [formData, setFormData] = useState({
    id: "",
    email: "",
    firstName: "",
    lastName: "",
  });

  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [logoutSnackbar, setLogoutSnackbar] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(
          `http://localhost:8080/api/auth/user?email=${encodeURIComponent(
            userEmail
          )}`
        );

        setFormData({
          id: data.id,
          email: data.email || "",
          firstName: data.firstName || "",
          lastName: data.lastName || "",
        });
        setError("");
      } catch (err) {
        console.error("Error fetching user:", err);
        setError(
          typeof err.response?.data === "string"
            ? err.response.data
            : err.response?.data?.error ||
                "Failed to load user data. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    if (userEmail) {
      fetchUser();
    } else {
      const localUser = JSON.parse(localStorage.getItem("user"));
      if (localUser) setFormData(localUser);
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
          firstName: formData.firstName,
          lastName: formData.lastName,
        };

        const { data } = await axios.patch(
          `http://localhost:8080/api/auth/user/${formData.id}`,
          payload
        );

        if (data === "User details updated successfully") {
          setSuccess("Profile updated successfully!");
          localStorage.setItem("user", JSON.stringify(formData));
        } else {
          setError(data);
        }
      } catch (err) {
        console.error("Error updating user:", err);
        setError(
          typeof err.response?.data === "string"
            ? err.response.data
            : err.response?.data?.error ||
                "An error occurred while saving changes. Please try again."
        );
      }
    }

    setIsEditing((prev) => !prev);
  };

  const handleSignOut = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    if (onLogout) onLogout();

    setLogoutSnackbar(true);
    setTimeout(() => {
      navigate("/login");
    }, 1500);
  };

  const handleCloseSnackbar = () => {
    setLogoutSnackbar(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
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
          {["email", "firstName", "lastName"].map((field) => {
            const isEmailField = field === "email";
            return (
              <TextField
                key={field}
                label={field.charAt(0).toUpperCase() + field.slice(1)}
                variant="standard"
                fullWidth
                name={field}
                type="text"
                value={formData[field]}
                onChange={handleInputChange}
                InputProps={{
                  readOnly: isEmailField ? true : !isEditing,
                }}
                sx={{
                  "& .MuiInput-underline:before": {
                    borderBottomColor:
                      isEditing && !isEmailField ? "#f44336" : "#ccc",
                  },
                  "& .MuiInput-underline:after": {
                    borderBottomColor:
                      isEditing && !isEmailField ? "#f44336" : "#1976d2",
                  },
                  "& .MuiFormLabel-root": {
                    color:
                      isEditing && !isEmailField
                        ? "#f44336"
                        : "rgba(0,0,0,0.6)",
                  },
                  "&:hover .MuiInput-underline:before": {
                    borderBottomColor:
                      isEditing && !isEmailField ? "#e53935" : "#000",
                  },
                }}
              />
            );
          })}

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
          <Button
            variant="outlined"
            color="error"
            onClick={handleSignOut}
            sx={{
              mt: 2,
              borderRadius: "30px",
              py: 1.2,
              fontWeight: "bold",
              borderWidth: 2,
              "&:hover": {
                borderWidth: 2,
                backgroundColor: "#fff5f5",
              },
            }}
          >
            Sign Out
          </Button>
        </Stack>
      </Box>
      <Snackbar
        open={logoutSnackbar}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="success"
          sx={{ width: "100%" }}
        >
          You have been logged out successfully.
        </Alert>
      </Snackbar>
    </>
  );
};

export default Settings;
