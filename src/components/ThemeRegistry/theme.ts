import { createTheme } from "@mui/material/styles";
import type {} from "@mui/x-data-grid/themeAugmentation";

// Paleta profesional para farmacia: verde-azulado (salud, confianza) como
// color principal y un acento cálido para llamadas a la acción / urgencias.
const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0E7C66",
      light: "#3F9C8A",
      dark: "#0A5C4C",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#E8720C",
      light: "#F2924A",
      dark: "#B85A09",
      contrastText: "#FFFFFF",
    },
    error: {
      main: "#D32F2F",
    },
    success: {
      main: "#2E7D32",
    },
    background: {
      default: "#F5F7F7",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#1B2A27",
      secondary: "#5B6E69",
    },
    divider: "rgba(14, 124, 102, 0.12)",
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: "var(--font-geist-sans)",
    h1: {
      fontSize: "2.75rem",
      fontWeight: 700,
      letterSpacing: "-0.02em",
      "@media (max-width:600px)": {
        fontSize: "2.1rem",
      },
    },
    h2: {
      fontSize: "2.1rem",
      fontWeight: 700,
      letterSpacing: "-0.01em",
      "@media (max-width:600px)": {
        fontSize: "1.75rem",
      },
    },
    h3: {
      fontSize: "1.75rem",
      fontWeight: 700,
      "@media (max-width:600px)": {
        fontSize: "1.5rem",
      },
    },
    h4: {
      fontSize: "1.5rem",
      fontWeight: 700,
      "@media (max-width:600px)": {
        fontSize: "1.3rem",
      },
    },
    h5: {
      fontSize: "1.25rem",
      fontWeight: 600,
      "@media (max-width:600px)": {
        fontSize: "1.125rem",
      },
    },
    h6: {
      fontSize: "1.125rem",
      fontWeight: 600,
      "@media (max-width:600px)": {
        fontSize: "1rem",
      },
    },
    subtitle1: {
      color: "#5B6E69",
    },
    button: {
      fontWeight: 600,
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
  shadows: [
    "none",
    "0px 1px 2px rgba(16, 40, 34, 0.06)",
    "0px 2px 6px rgba(16, 40, 34, 0.07)",
    "0px 4px 10px rgba(16, 40, 34, 0.08)",
    "0px 6px 14px rgba(16, 40, 34, 0.09)",
    "0px 8px 18px rgba(16, 40, 34, 0.10)",
    "0px 10px 22px rgba(16, 40, 34, 0.10)",
    "0px 12px 26px rgba(16, 40, 34, 0.11)",
    "0px 14px 30px rgba(16, 40, 34, 0.11)",
    "0px 16px 34px rgba(16, 40, 34, 0.12)",
    "0px 16px 34px rgba(16, 40, 34, 0.12)",
    "0px 16px 34px rgba(16, 40, 34, 0.12)",
    "0px 16px 34px rgba(16, 40, 34, 0.12)",
    "0px 16px 34px rgba(16, 40, 34, 0.12)",
    "0px 16px 34px rgba(16, 40, 34, 0.12)",
    "0px 16px 34px rgba(16, 40, 34, 0.12)",
    "0px 16px 34px rgba(16, 40, 34, 0.12)",
    "0px 16px 34px rgba(16, 40, 34, 0.12)",
    "0px 16px 34px rgba(16, 40, 34, 0.12)",
    "0px 16px 34px rgba(16, 40, 34, 0.12)",
    "0px 16px 34px rgba(16, 40, 34, 0.12)",
    "0px 16px 34px rgba(16, 40, 34, 0.12)",
    "0px 16px 34px rgba(16, 40, 34, 0.12)",
    "0px 16px 34px rgba(16, 40, 34, 0.12)",
    "0px 16px 34px rgba(16, 40, 34, 0.12)",
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#F5F7F7",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 10,
          minHeight: 44,
          fontWeight: 600,
          boxShadow: "none",
          "@media (max-width:600px)": {
            minHeight: 48,
            fontSize: "0.875rem",
          },
        },
        contained: {
          boxShadow: "0px 2px 6px rgba(16, 40, 34, 0.15)",
          "&:hover": {
            boxShadow: "0px 4px 12px rgba(16, 40, 34, 0.2)",
          },
        },
        outlined: {
          borderWidth: 1.5,
          "&:hover": {
            borderWidth: 1.5,
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
            minHeight: 56,
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
      },
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
          },
          "& .MuiInputBase-root": {
            minHeight: 44,
            "@media (max-width:600px)": {
              minHeight: 48,
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
        rounded: {
          borderRadius: 14,
        },
        elevation1: {
          boxShadow: "0px 1px 3px rgba(16, 40, 34, 0.08)",
          border: "1px solid rgba(14, 124, 102, 0.08)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: "1px solid rgba(14, 124, 102, 0.08)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 8,
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
          borderRight: "1px solid rgba(14, 124, 102, 0.1)",
          backgroundColor: "#FFFFFF",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          backgroundColor: "#EAF3F0",
          color: "#0A5C4C",
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: "none",
          borderRadius: 12,
          "--DataGrid-rowBorderColor": "rgba(14, 124, 102, 0.08)",
        },
        columnHeaders: {
          backgroundColor: "#EAF3F0",
          borderRadius: 0,
        },
        columnHeaderTitle: {
          fontWeight: 700,
          color: "#0A5C4C",
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: 700,
        },
      },
    },
  },
});

export default theme;
