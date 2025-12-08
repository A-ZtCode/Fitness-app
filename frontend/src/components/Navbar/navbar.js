import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import BarChartIcon from "@mui/icons-material/BarChart";
import BookIcon from "@mui/icons-material/Book";
import SettingsIcon from "@mui/icons-material/Settings";

const NavbarComponent = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation(); // MN_scrum_13 - active tab colour
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width:768px)");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navItems = [
    {
      label: "Track New Exercise",
      route: "/trackExercise",
      icon: <FitnessCenterIcon />,
    },
    { label: "Statistics", route: "/statistics", icon: <BarChartIcon /> },
    { label: "Journal", route: "/journal", icon: <BookIcon /> },
    { label: "Settings", route: "/settings", icon: <SettingsIcon /> },
  ];

  const onNavigate = (route) => {
    navigate(route);
    setDrawerOpen(false);
  };

  const toggleDrawer = (open) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }
    setDrawerOpen(open);
  };

  // Mobile drawer content
  const drawerContent = (
    <Box
      sx={{
        width: 280,
        height: "100%",
        backgroundColor: "var(--bg-elevated)",
        pt: 2,
      }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <List>
        {navItems.map((item) => (
          <ListItem key={item.route} disablePadding>
            <ListItemButton
              onClick={() => onNavigate(item.route)}
              sx={{
                py: 1.5,
                px: 3,
                backgroundColor:
                  location.pathname === item.route
                    ? "var(--bg-secondary)"
                    : "transparent",
                borderLeft:
                  location.pathname === item.route
                    ? "4px solid var(--color-primary)"
                    : "4px solid transparent",
                "&:hover": {
                  backgroundColor: "var(--bg-secondary)",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color:
                    location.pathname === item.route
                      ? "var(--color-primary)"
                      : "var(--text-muted)",
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                sx={{
                  "& .MuiListItemText-primary": {
                    fontWeight: location.pathname === item.route ? 600 : 400,
                    color:
                      location.pathname === item.route
                        ? "var(--color-primary)"
                        : "var(--text-primary)",
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  // Mobile view - hamburger menu
  if (isMobile) {
    return (
      <>
        <IconButton
          onClick={toggleDrawer(true)}
          sx={{
            color: "var(--text-primary)",
            backgroundColor: "var(--bg-secondary)",
            borderRadius: "var(--radius-sm)",
            "&:hover": {
              backgroundColor: "var(--bg-tertiary)",
            },
          }}
        >
          <MenuIcon />
        </IconButton>
        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={toggleDrawer(false)}
          PaperProps={{
            sx: {
              backgroundColor: "var(--bg-elevated)",
              borderLeft: "1px solid var(--border-light)",
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </>
    );
  }

  // Desktop view - horizontal tabs
  return (
    <Box
      sx={{
        display: "flex",
        gap: 1,
      }}
    >
      {navItems.map((item) => (
        <Box
          key={item.route}
          onClick={() => onNavigate(item.route)}
          sx={{
            px: 2,
            py: 1,
            cursor: "pointer",
            fontWeight: 600,
            color:
              location.pathname === item.route
                ? "var(--color-primary)"
                : "var(--text-primary)",
            position: "relative",
            transition: "color 0.3s ease",
            "&:hover": {
              color: "var(--color-primary)",
            },
            "&::after":
              location.pathname === item.route
                ? {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: -6,
                    height: 3,
                    margin: "0 auto",
                    width: "60%",
                    borderRadius: 3,
                    backgroundColor: "var(--color-primary)",
                    boxShadow:
                      "0 0 0 2px rgba(0, 0, 0, 0.05), 0 6px 16px rgba(0, 0, 0, 0.15)",
                  }
                : {},
          }}
        >
          {item.label}
        </Box>
      ))}
    </Box>
  );
};

export default NavbarComponent;
