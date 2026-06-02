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

// Definición de un tema premium con los colores originales del proyecto (#0B750E y #E81312)
const theme = createTheme({
  typography: {
    fontFamily: '"Outfit", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontWeight: 700,
      letterSpacing: "-0.015em",
    },
    h3: {
      fontWeight: 700,
      letterSpacing: "-0.01em",
    },
    h4: {
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
    h5: {
      fontWeight: 600,
      letterSpacing: "-0.005em",
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
      letterSpacing: "0.015em",
      lineHeight: 1.6,
    },
    body2: {
      fontWeight: 400,
      letterSpacing: "0.015em",
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 600,
      textTransform: "none",
      letterSpacing: "0.02em",
    },
    caption: {
      fontWeight: 400,
      letterSpacing: "0.01em",
    },
  },
  palette: {
    primary: {
      main: "#0B750E", // Color original verde
    },
    secondary: {
      main: "#E81312", // Color original rojo
    },
    text: {
      primary: "#222222",
      secondary: "#666666",
    },
    background: {
      default: "#f5f5f5",
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          padding: "8px 18px",
          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          boxShadow: "none",
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: "0 4px 12px rgba(11, 117, 14, 0.2)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: "16px",
          border: "1px solid rgba(255, 255, 255, 0.45)",
          boxShadow: "0 12px 36px 0 rgba(0, 0, 0, 0.08)",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.5)",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: "8px",
            transition: "all 0.3s ease",
            "& fieldset": {
              borderColor: "rgba(0, 0, 0, 0.12)",
            },
            "&:hover fieldset": {
              borderColor: "rgba(0, 0, 0, 0.24)",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#0B750E",
            },
          },
          "& .MuiInputLabel-root": {
            "&.Mui-focused": {
              color: "#0B750E",
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          "& fieldset": {
            borderColor: "rgba(0, 0, 0, 0.12)",
          },
          "&:hover fieldset": {
            borderColor: "rgba(0, 0, 0, 0.24)",
          },
          "&.Mui-focused fieldset": {
            borderColor: "#0B750E",
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
