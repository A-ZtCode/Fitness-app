import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Stack,
  Typography,
  CircularProgress,
  Snackbar,
  Divider,
  Paper,
  Container,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import ThemeSelector from "./ThemeSelector.js";

const validateName = (value) => {
  const trimmed = value.trim();
  if (/<[^>]*>/g.test(trimmed)) {
    return { valid: false, message: "Invalid characters detected." };
  }
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  if (!nameRegex.test(trimmed)) {
    return {
      valid: false,
      message:
        "Names can only contain letters, spaces, apostrophes, and hyphens.",
    };
  }
  if (trimmed.length < 1 || trimmed.length > 50) {
    return { valid: false, message: "Name must be between 1–50 characters." };
  }
  return { valid: true };
};

const Settings = ({ userEmail, onLogout }) => {
  const [formData, setFormData] = useState({
    id: "",
    email: "",
    firstName: "",
    lastName: "",
  });

  const [userData, setUserData] = useState(null);
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

        const user = {
          id: data.id,
          email: data.email || "",
          firstName: data.firstName || "",
          lastName: data.lastName || "",
        };
        setFormData(user);
        setUserData(user);
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
      if (localUser) {
        setFormData(localUser);
        setUserData(localUser);
      }
      setLoading(false);
    }
  }, [userEmail]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "firstName" || name === "lastName") {
      const { valid } = validateName(value);
      if (!valid && value !== "") return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleEdit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const hasChanged =
      formData.firstName !== userData.firstName ||
      formData.lastName !== userData.lastName;

    if (hasChanged && isEditing) {
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
          setUserData(formData);
          localStorage.setItem("user", JSON.stringify(formData));
          setIsEditing(false);
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
    } else {
      setIsEditing((prev) => !prev);
    }
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
        <CircularProgress sx={{ color: "var(--color-primary)" }} />
      </Box>
    );
  }

  const isSaveDisabled =
    !formData.firstName.trim() || !formData.lastName.trim();

  const fieldLabels = {
    email: "Email",
    firstName: "First Name",
    lastName: "Last Name",
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          color: "var(--text-primary)",
          mb: 4,
          fontWeight: 700,
        }}
      >
        Settings
      </Typography>

      <Paper
        sx={{
          p: 4,
          mb: 3,
          backgroundColor: "var(--bg-elevated)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-md)",
          border: "1px solid var(--border-light)",
          transition: "all 0.3s ease",
        }}
      >
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            color: "var(--text-primary)",
            mb: 3,
            fontWeight: 600,
          }}
        >
          Account Details
        </Typography>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              backgroundColor: "var(--color-error-bg)",
              color: "var(--text-primary)",
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
              mb: 2,
              backgroundColor: "var(--color-success-bg)",
              color: "var(--text-primary)",
              "& .MuiAlert-icon": {
                color: "var(--color-success)",
              },
            }}
          >
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleToggleEdit} noValidate>
          <Stack spacing={3}>
            {["email", "firstName", "lastName"].map((field) => {
              const isEmailField = field === "email";
              const label = fieldLabels[field];
              const hasError =
                isEditing &&
                !isEmailField &&
                (!formData[field].trim() ||
                  !validateName(formData[field]).valid);

              return (
                <Box key={field}>
                  <Typography
                    component="label"
                    htmlFor={field}
                    sx={{
                      display: "block",
                      color: "var(--text-primary)",
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      mb: 1,
                    }}
                  >
                    {label}
                  </Typography>

                  {isEmailField ? (
                    <Typography
                      sx={{
                        color: "var(--text-muted)",
                        fontSize: "1rem",
                        py: 1.5,
                        px: 0,
                      }}
                    >
                      {formData.email}
                    </Typography>
                  ) : (
                    <Box
                      component="input"
                      id={field}
                      name={field}
                      type="text"
                      value={formData[field]}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      sx={{
                        width: "100%",
                        padding: "14px 16px",
                        fontSize: "1rem",
                        fontFamily: "inherit",
                        color: "var(--text-primary)",
                        backgroundColor: isEditing
                          ? "var(--bg-primary)"
                          : "var(--bg-secondary)",
                        border: hasError
                          ? "2px solid var(--color-error)"
                          : "1px solid var(--border-medium)",
                        borderRadius: "8px",
                        outline: "none",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          borderColor: isEditing
                            ? "var(--color-primary)"
                            : "var(--border-medium)",
                        },
                        "&:focus": {
                          borderColor: "var(--color-primary)",
                          borderWidth: "2px",
                        },
                        "&:disabled": {
                          backgroundColor: "var(--bg-secondary)",
                          color: "var(--text-muted)",
                          cursor: "not-allowed",
                        },
                      }}
                    />
                  )}

                  {(hasError || isEmailField) && (
                    <Typography
                      sx={{
                        color: hasError
                          ? "var(--color-error)"
                          : "var(--text-muted)",
                        fontSize: "0.875rem",
                        mt: 0.5,
                      }}
                    >
                      {hasError
                        ? !formData[field].trim()
                          ? "This field is required"
                          : validateName(formData[field]).message
                        : ""}
                    </Typography>
                  )}
                </Box>
              );
            })}

            <Button
              type="submit"
              variant="contained"
              disabled={isEditing && isSaveDisabled}
              sx={{
                mt: 2,
                borderRadius: "30px",
                py: 1.5,
                fontWeight: 700,
                fontSize: "1rem",
                backgroundColor: isEditing
                  ? "var(--color-success)"
                  : "var(--color-primary)",
                color: "#FFFFFF",
                textTransform: "none",
                boxShadow: "var(--shadow-md)",
                transition: "all 0.3s ease",

                "&.Mui-disabled": {
                  backgroundColor: "var(--border-medium)",
                  color: "var(--text-muted)",
                  opacity: 0.6,
                },

                "&:hover": {
                  backgroundColor: isEditing
                    ? "#047857"
                    : "var(--color-primary-hover)",
                  boxShadow: "var(--shadow-lg)",
                  transform: "translateY(-1px)",
                },

                "&:active": {
                  transform: "translateY(0)",
                },
              }}
            >
              {isEditing ? "Save Changes" : "Edit Profile"}
            </Button>
          </Stack>
        </Box>
      </Paper>

      <Divider sx={{ my: 3, borderColor: "var(--border-light)" }} />

      <Paper
        sx={{
          p: 4,
          mb: 3,
          backgroundColor: "var(--bg-elevated)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-md)",
          border: "1px solid var(--border-light)",
          transition: "all 0.3s ease",
        }}
      >
        <ThemeSelector />
      </Paper>

      <Divider sx={{ my: 3, borderColor: "var(--border-light)" }} />

      <Paper
        sx={{
          p: 4,
          backgroundColor: "var(--bg-elevated)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-md)",
          border: "1px solid var(--border-light)",
          transition: "all 0.3s ease",
        }}
      >
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            color: "var(--text-primary)",
            mb: 2,
            fontWeight: 600,
          }}
        >
          Account Actions
        </Typography>

        <Button
          variant="outlined"
          onClick={handleSignOut}
          sx={{
            mt: 2,
            borderRadius: "30px",
            py: 1.2,
            px: 3,
            fontWeight: 700,
            fontSize: "1rem",
            borderWidth: "2px",
            borderColor: "var(--color-error)",
            color: "var(--color-error)",
            textTransform: "none",
            transition: "all 0.3s ease",

            "&:hover": {
              borderWidth: "2px",
              borderColor: "var(--color-error)",
              backgroundColor: "var(--color-error-bg)",
              transform: "translateY(-1px)",
            },

            "&:active": {
              transform: "translateY(0)",
            },
          }}
        >
          Sign Out
        </Button>
      </Paper>

      <Snackbar
        open={logoutSnackbar}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="success"
          sx={{
            width: "100%",
            backgroundColor: "var(--color-success)",
            color: "#FFFFFF",
            fontWeight: 600,
            "& .MuiAlert-icon": {
              color: "#FFFFFF",
            },
          }}
        >
          You have been logged out successfully.
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Settings;
