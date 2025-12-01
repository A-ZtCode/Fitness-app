import React from "react";
import { Box, Typography, Paper, Grid, Radio } from "@mui/material";
import { useTheme } from "../../contexts/ThemeContext.js";
import "./ThemeSelector.css";

const ThemeSelector = () => {
  const { currentTheme, changeTheme, themes } = useTheme();

  const themePreviewColors = {
    light: ["#5a75e0", "#FFFFFF", "#F7FAFC"],
    dark: ["#6b8aff", "#1a1a1a", "#2d2d2d"],
    ocean: ["#0284c7", "#f0f9ff", "#e0f2fe"],
    forest: ["#16a34a", "#f0fdf4", "#dcfce7"],
    sunset: ["#ea580c", "#fff7ed", "#ffedd5"],
    purple: ["#9333ea", "#faf5ff", "#f3e8ff"],
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography
        variant="h6"
        gutterBottom
        sx={{ color: "var(--text-primary)" }}
      >
        Color Theme
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: "var(--text-secondary)", mb: 3 }}
      >
        Choose a color theme that suits your preference. All themes are designed
        with accessibility in mind.
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          justifyContent: "flex-start",
        }}
      >
        {Object.entries(themes).map(([key, theme]) => (
          <Paper
            key={key}
            className={`theme-option ${currentTheme === key ? "selected" : ""}`}
            onClick={() => changeTheme(key)}
            sx={{
              p: 2,
              cursor: "pointer",
              border:
                currentTheme === key
                  ? "2px solid var(--color-primary)"
                  : "1px solid var(--border-light)",
              backgroundColor: "var(--bg-elevated)",
              transition: "all 0.3s ease",
              display: "flex",
              flexDirection: "column",
              width: { xs: "calc(50% - 8px)", sm: "calc(50% - 8px)", md: 180 },
              minWidth: 160,
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "var(--shadow-md)",
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                mb: 2,
                flexDirection: "column",
                textAlign: "center",
              }}
            >
              <Radio
                checked={currentTheme === key}
                value={key}
                sx={{
                  color: "var(--text-muted)",
                  "&.Mui-checked": {
                    color: "var(--color-primary)",
                  },
                  mb: 0.5,
                }}
              />
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: currentTheme === key ? 600 : 400,
                  color: "var(--text-primary)",
                  fontSize: "0.875rem",
                }}
              >
                {theme.name}
              </Typography>
            </Box>

            <Box
              className="theme-preview"
              sx={{
                display: "flex",
                gap: 0.5,
                height: 40,
                mt: "auto",
              }}
            >
              {themePreviewColors[key].map((color, index) => (
                <Box
                  key={index}
                  sx={{
                    flex: 1,
                    backgroundColor: color,
                    borderRadius: 1,
                    border: "1px solid var(--border-light)",
                  }}
                />
              ))}
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
};

export default ThemeSelector;
