import React, { useMemo } from "react";
import { ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { useTheme, themes } from "./ThemeContext.js";

/**
 * MUI Theme Provider that syncs with the app's ThemeContext
 * This ensures MUI components respect the user's selected theme
 */
export const MuiThemeWrapper = ({ children }) => {
  const { currentTheme } = useTheme();
  const themeConfig = themes[currentTheme];

  const muiTheme = useMemo(() => {
    const colors = themeConfig.colors;
    const isDark = currentTheme === "dark";

    return createTheme({
      palette: {
        mode: isDark ? "dark" : "light",
        primary: {
          main: colors["color-primary"],
          dark: colors["color-primary-hover"],
          light: colors["color-primary-active"],
          contrastText: colors["text-inverse"],
        },
        secondary: {
          main: colors["color-info"],
          contrastText: colors["text-inverse"],
        },
        error: {
          main: colors["color-error"],
          light: colors["color-error-bg"],
        },
        warning: {
          main: colors["color-warning"],
          light: colors["color-warning-bg"],
        },
        success: {
          main: colors["color-success"],
          light: colors["color-success-bg"],
        },
        info: {
          main: colors["color-info"],
          light: colors["color-info-bg"],
        },
        background: {
          default: colors["bg-primary"],
          paper: colors["bg-elevated"],
        },
        text: {
          primary: colors["text-primary"],
          secondary: colors["text-secondary"],
          disabled: colors["text-muted"],
        },
        divider: colors["border-light"],
      },
      typography: {
        fontFamily: '"Barlow", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
      },
      shape: {
        borderRadius: 8,
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 999,
            },
            contained: {
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              "&:hover": {
                boxShadow: "0 6px 16px rgba(0, 0, 0, 0.2)",
              },
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: "none",
            },
          },
        },
        MuiTextField: {
          styleOverrides: {
            root: {
              "& .MuiOutlinedInput-root": {
                "&:hover fieldset": {
                  borderColor: colors["color-primary"],
                },
                "&.Mui-focused fieldset": {
                  borderColor: colors["color-primary"],
                },
              },
            },
          },
        },
        MuiSelect: {
          styleOverrides: {
            root: {
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: colors["color-primary"],
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: colors["color-primary"],
              },
            },
          },
        },
        MuiIconButton: {
          styleOverrides: {
            root: {
              "&:hover": {
                backgroundColor: `${colors["color-primary"]}15`,
              },
            },
          },
        },
        MuiAlert: {
          styleOverrides: {
            standardSuccess: {
              backgroundColor: colors["color-success-bg"],
              color: colors["color-success"],
            },
            standardError: {
              backgroundColor: colors["color-error-bg"],
              color: colors["color-error"],
            },
            standardWarning: {
              backgroundColor: colors["color-warning-bg"],
              color: colors["color-warning"],
            },
            standardInfo: {
              backgroundColor: colors["color-info-bg"],
              color: colors["color-info"],
            },
          },
        },
      },
    });
  }, [currentTheme, themeConfig]);

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};

export default MuiThemeWrapper;
