import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// rolRequerido: "usuario" | "administrador" | null (cualquiera autenticado)
export default function RutaProtegida({ children, rolRequerido }) {
  const { usuario, rol } = useAuth();

  if (!usuario) return <Navigate to="/" replace />;
  if (rolRequerido && rol !== rolRequerido) {
    // Si es admin intentando entrar a vista usuario o viceversa
    return <Navigate to={rol === "administrador" ? "/admin" : "/usuario"} replace />;
  }

  return children;
}
