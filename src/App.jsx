import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import RutaProtegida from "./components/RutaProtegida/RutaProtegida";
import Home from "./Pages/Home/Home";
import Register from "./Pages/Home/Register";
import UsuarioVista from "./Pages/UsuarioVista/UsuarioVista";
import AdministradorVista from "./Pages/AdministradorVista/AdministradorVista";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Footer from "./components/Footer/Footer";

// Definición de un tema oscuro ultra-premium estilo Apple/Stripe
const theme = createTheme({
  typography: {
    fontFamily: '"Outfit", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
      letterSpacing: "-0.025em",
    },
    h2: {
      fontWeight: 800,
      letterSpacing: "-0.02em",
    },
    h3: {
      fontWeight: 700,
      letterSpacing: "-0.015em",
    },
    h4: {
      fontWeight: 700,
      letterSpacing: "-0.01em",
    },
    h5: {
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
    h6: {
      fontWeight: 600,
      letterSpacing: "0em",
    },
    subtitle1: {
      fontWeight: 500,
      letterSpacing: "0em",
    },
    subtitle2: {
      fontWeight: 500,
      letterSpacing: "0em",
    },
    body1: {
      fontWeight: 400,
      letterSpacing: "0.01em",
      lineHeight: 1.6,
    },
    body2: {
      fontWeight: 400,
      letterSpacing: "0.01em",
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 600,
      textTransform: "none",
      letterSpacing: "0.015em",
    },
    caption: {
      fontWeight: 400,
      letterSpacing: "0.005em",
    },
  },
  palette: {
    mode: "dark",
    primary: {
      main: "#10b981", // Tech emerald green
      light: "#34d399",
      dark: "#059669",
    },
    secondary: {
      main: "#ef4444", // Rojo vibrante
      light: "#f87171",
      dark: "#dc2626",
    },
    background: {
      default: "#08090d",
      paper: "rgba(18, 22, 33, 0.72)",
    },
    text: {
      primary: "#f3f4f6",
      secondary: "#9ca3af",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          padding: "10px 20px",
          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          boxShadow: "none",
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: "0 6px 20px rgba(16, 185, 129, 0.2)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: "16px",
          background: "rgba(18, 22, 33, 0.72)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 16px 40px rgba(0, 0, 0, 0.3)",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: "rgba(18, 22, 33, 0.88)",
          backdropFilter: "blur(25px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: "12px",
            transition: "all 0.3s ease",
            "& fieldset": {
              borderColor: "rgba(255, 255, 255, 0.12)",
            },
            "&:hover fieldset": {
              borderColor: "rgba(255, 255, 255, 0.25)",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#10b981",
            },
          },
          "& .MuiInputLabel-root": {
            color: "rgba(255, 255, 255, 0.5)",
            "&.Mui-focused": {
              color: "#10b981",
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          "& fieldset": {
            borderColor: "rgba(255, 255, 255, 0.12)",
          },
          "&:hover fieldset": {
            borderColor: "rgba(255, 255, 255, 0.25)",
          },
          "&.Mui-focused fieldset": {
            borderColor: "#10b981",
          },
        },
      },
    },
  },
});

// Redirige según rol si ya está autenticado
function RutaPublica({ children }) {
  const { usuario, rol } = useAuth();
  if (usuario) {
    return <Navigate to={rol === "administrador" ? "/admin" : "/usuario"} replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <>
      <Routes>
        <Route path="/" element={<RutaPublica><Home /></RutaPublica>} />
        <Route path="/register" element={<RutaPublica><Register /></RutaPublica>} />
        <Route
          path="/usuario"
          element={<RutaProtegida rolRequerido="usuario"><UsuarioVista /></RutaProtegida>}
        />
        <Route
          path="/admin"
          element={<RutaProtegida rolRequerido="administrador"><AdministradorVista /></RutaProtegida>}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
