import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import RutaProtegida from "./components/RutaProtegida/RutaProtegida";
import Home from "./Pages/Home/Home";
import Register from "./Pages/Home/Register";
import UsuarioVista from "./Pages/UsuarioVista/UsuarioVista";
import AdministradorVista from "./Pages/AdministradorVista/AdministradorVista";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

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
      main: "#0B750E",
    },
    secondary: {
      main: "#E81312",
    },
    text: {
      primary: "#222222",
      secondary: "#666666",
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
