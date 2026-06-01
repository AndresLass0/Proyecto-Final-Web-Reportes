import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import RutaProtegida from "./components/RutaProtegida/RutaProtegida";
import Home from "./Pages/Home/Home";
import Register from "./Pages/Home/Register";
import UsuarioVista from "./Pages/UsuarioVista/UsuarioVista";
import AdministradorVista from "./Pages/AdministradorVista/AdministradorVista";

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
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
