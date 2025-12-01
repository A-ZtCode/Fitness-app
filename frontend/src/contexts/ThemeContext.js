import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const themes = {
  light: {
    name: "Light",
    colors: {
      "bg-primary": "#FFFFFF",
      "bg-secondary": "#F7FAFC",
      "bg-tertiary": "#EDF2F7",
      "bg-elevated": "#FFFFFF",

      "text-primary": "#1a1a1a",
      "text-secondary": "#4a5568",
      "text-muted": "#718096",
      "text-inverse": "#FFFFFF",

      "color-primary": "#5a75e0",
      "color-primary-hover": "#4a63cc",
      "color-primary-active": "#3a51b8",

      "color-success": "#047857",
      "color-success-bg": "#D1FAE5",
      "color-error": "#DC2626",
      "color-error-bg": "#FEE2E2",
      "color-warning": "#D97706",
      "color-warning-bg": "#FEF3C7",
      "color-info": "#0891B2",
      "color-info-bg": "#CFFAFE",

      "border-light": "#E2E8F0",
      "border-medium": "#CBD5E0",
      "border-dark": "#A0AEC0",

      "shadow-sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      "shadow-md": "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      "shadow-lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    },
  },

  dark: {
    name: "Dark",
    colors: {
      "bg-primary": "#1a1a1a",
      "bg-secondary": "#2d2d2d",
      "bg-tertiary": "#3d3d3d",
      "bg-elevated": "#2d2d2d",

      "text-primary": "#F7FAFC",
      "text-secondary": "#E2E8F0",
      "text-muted": "#A0AEC0",
      "text-inverse": "#1a1a1a",

      "color-primary": "#6b8aff",
      "color-primary-hover": "#7b9aff",
      "color-primary-active": "#5a75e0",

      "color-success": "#10b981",
      "color-success-bg": "#064e3b",
      "color-error": "#ef4444",
      "color-error-bg": "#7f1d1d",
      "color-warning": "#f59e0b",
      "color-warning-bg": "#78350f",
      "color-info": "#06b6d4",
      "color-info-bg": "#164e63",

      "border-light": "#4a5568",
      "border-medium": "#718096",
      "border-dark": "#A0AEC0",

      "shadow-sm": "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
      "shadow-md": "0 4px 6px -1px rgba(0, 0, 0, 0.4)",
      "shadow-lg": "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
    },
  },

  ocean: {
    name: "Ocean",
    colors: {
      "bg-primary": "#f0f9ff",
      "bg-secondary": "#e0f2fe",
      "bg-tertiary": "#bae6fd",
      "bg-elevated": "#FFFFFF",

      "text-primary": "#0c4a6e",
      "text-secondary": "#075985",
      "text-muted": "#0369a1",
      "text-inverse": "#FFFFFF",

      "color-primary": "#0284c7",
      "color-primary-hover": "#0369a1",
      "color-primary-active": "#075985",

      "color-success": "#047857",
      "color-success-bg": "#D1FAE5",
      "color-error": "#DC2626",
      "color-error-bg": "#FEE2E2",
      "color-warning": "#D97706",
      "color-warning-bg": "#FEF3C7",
      "color-info": "#0891B2",
      "color-info-bg": "#CFFAFE",

      "border-light": "#7dd3fc",
      "border-medium": "#38bdf8",
      "border-dark": "#0284c7",

      "shadow-sm": "0 1px 2px 0 rgba(2, 132, 199, 0.05)",
      "shadow-md": "0 4px 6px -1px rgba(2, 132, 199, 0.1)",
      "shadow-lg": "0 10px 15px -3px rgba(2, 132, 199, 0.1)",
    },
  },

  forest: {
    name: "Forest",
    colors: {
      "bg-primary": "#f0fdf4",
      "bg-secondary": "#dcfce7",
      "bg-tertiary": "#bbf7d0",
      "bg-elevated": "#FFFFFF",

      "text-primary": "#14532d",
      "text-secondary": "#166534",
      "text-muted": "#15803d",
      "text-inverse": "#FFFFFF",

      "color-primary": "#16a34a",
      "color-primary-hover": "#15803d",
      "color-primary-active": "#166534",

      "color-success": "#047857",
      "color-success-bg": "#D1FAE5",
      "color-error": "#DC2626",
      "color-error-bg": "#FEE2E2",
      "color-warning": "#D97706",
      "color-warning-bg": "#FEF3C7",
      "color-info": "#0891B2",
      "color-info-bg": "#CFFAFE",

      "border-light": "#86efac",
      "border-medium": "#4ade80",
      "border-dark": "#22c55e",

      "shadow-sm": "0 1px 2px 0 rgba(22, 163, 74, 0.05)",
      "shadow-md": "0 4px 6px -1px rgba(22, 163, 74, 0.1)",
      "shadow-lg": "0 10px 15px -3px rgba(22, 163, 74, 0.1)",
    },
  },

  sunset: {
    name: "Sunset",
    colors: {
      "bg-primary": "#fff7ed",
      "bg-secondary": "#ffedd5",
      "bg-tertiary": "#fed7aa",
      "bg-elevated": "#FFFFFF",

      "text-primary": "#7c2d12",
      "text-secondary": "#9a3412",
      "text-muted": "#c2410c",
      "text-inverse": "#FFFFFF",

      "color-primary": "#ea580c",
      "color-primary-hover": "#c2410c",
      "color-primary-active": "#9a3412",

      "color-success": "#047857",
      "color-success-bg": "#D1FAE5",
      "color-error": "#DC2626",
      "color-error-bg": "#FEE2E2",
      "color-warning": "#D97706",
      "color-warning-bg": "#FEF3C7",
      "color-info": "#0891B2",
      "color-info-bg": "#CFFAFE",

      "border-light": "#fdba74",
      "border-medium": "#fb923c",
      "border-dark": "#f97316",

      "shadow-sm": "0 1px 2px 0 rgba(234, 88, 12, 0.05)",
      "shadow-md": "0 4px 6px -1px rgba(234, 88, 12, 0.1)",
      "shadow-lg": "0 10px 15px -3px rgba(234, 88, 12, 0.1)",
    },
  },

  purple: {
    name: "Purple Haze",
    colors: {
      "bg-primary": "#faf5ff",
      "bg-secondary": "#f3e8ff",
      "bg-tertiary": "#e9d5ff",
      "bg-elevated": "#FFFFFF",

      "text-primary": "#581c87",
      "text-secondary": "#6b21a8",
      "text-muted": "#7e22ce",
      "text-inverse": "#FFFFFF",

      "color-primary": "#9333ea",
      "color-primary-hover": "#7e22ce",
      "color-primary-active": "#6b21a8",

      "color-success": "#047857",
      "color-success-bg": "#D1FAE5",
      "color-error": "#DC2626",
      "color-error-bg": "#FEE2E2",
      "color-warning": "#D97706",
      "color-warning-bg": "#FEF3C7",
      "color-info": "#0891B2",
      "color-info-bg": "#CFFAFE",

      "border-light": "#d8b4fe",
      "border-medium": "#c084fc",
      "border-dark": "#a855f7",

      "shadow-sm": "0 1px 2px 0 rgba(147, 51, 234, 0.05)",
      "shadow-md": "0 4px 6px -1px rgba(147, 51, 234, 0.1)",
      "shadow-lg": "0 10px 15px -3px rgba(147, 51, 234, 0.1)",
    },
  },
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    const savedTheme = localStorage.getItem("app-theme");
    return savedTheme || "light";
  });

  useEffect(() => {
    const theme = themes[currentTheme];
    const root = document.documentElement;

    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });

    document.documentElement.setAttribute("data-theme", currentTheme);

    localStorage.setItem("app-theme", currentTheme);
  }, [currentTheme]);

  const changeTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, changeTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
};
