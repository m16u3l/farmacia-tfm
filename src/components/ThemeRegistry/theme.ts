import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
  typography: {
    fontFamily: "var(--font-geist-sans)",
    h1: {
      fontSize: "2.5rem",
      "@media (max-width:600px)": {
        fontSize: "2rem",
      },
    },
    h2: {
      fontSize: "2rem",
      "@media (max-width:600px)": {
        fontSize: "1.75rem",
      },
    },
    h3: {
      fontSize: "1.75rem",
      "@media (max-width:600px)": {
        fontSize: "1.5rem",
      },
    },
    h4: {
      fontSize: "1.5rem",
      "@media (max-width:600px)": {
        fontSize: "1.25rem",
      },
    },
    h5: {
      fontSize: "1.25rem",
      "@media (max-width:600px)": {
        fontSize: "1.125rem",
      },
    },
    h6: {
      fontSize: "1.125rem",
      "@media (max-width:600px)": {
        fontSize: "1rem",
      },
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 8,
          minHeight: 44, // Better touch target for mobile
          "@media (max-width:600px)": {
            minHeight: 48, // Even larger touch target on mobile
            fontSize: "0.875rem",
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: 44,
          minHeight: 44,
          "@media (max-width:600px)": {
            minWidth: 48,
            minHeight: 48,
          },
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          minHeight: 48,
          "@media (max-width:600px)": {
            minHeight: 56, // Larger touch targets on mobile
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiInputBase-root": {
            minHeight: 44,
            "@media (max-width:600px)": {
              minHeight: 48,
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "0px 2px 4px -1px rgba(0,0,0,0.2)",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: "1px solid rgba(0, 0, 0, 0.12)",
        },
      },
    },
  },
});

export default theme;
