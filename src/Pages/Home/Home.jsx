import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../../FireBase/config";
import {
  Box, TextField, Button, Typography, Alert,
  InputAdornment, IconButton, CircularProgress, Paper
} from "@mui/material";
import { Visibility, VisibilityOff, EmailOutlined, LockOutlined } from "@mui/icons-material";

export default function Home() {
  const { iniciarSesion, usuario } = useAuth();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPass, setMostrarPass] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    if (!correo || !password) { setError("Todos los campos son obligatorios"); return; }
    setCargando(true);
    try {
      const cred = await iniciarSesion(correo, password);
      const snap = await getDoc(doc(db, "usuarios", cred.user.uid));
      const rol = snap.data()?.rol;
      navigate(rol === "administrador" ? "/admin" : "/usuario");
    } catch (err) {
      setError("Correo o contraseña incorrectos");
    } finally {
      setCargando(false);
    }
  }

  return (
    <Box sx={{
      minHeight: "100vh", display: "flex",
      background: "linear-gradient(135deg, #0B750E 0%, #064d08 50%, #1a1a1a 100%)",
    }}>
      {/* Panel izquierdo decorativo */}
      <Box sx={{
        flex: 1, display: { xs: "none", md: "flex" },
        flexDirection: "column", alignItems: "center", justifyContent: "center",
        p: 6, color: "white"
      }}>
        {/* Logo SVG UA */}
        <Box sx={{ mb: 3 }}>
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
            <text x="10" y="85" fontSize="80" fontFamily="serif" fontWeight="bold" fill="#ffffff" opacity="0.9">UA</text>
            <ellipse cx="85" cy="25" rx="22" ry="10" fill="#E81312" opacity="0.9"/>
            <circle cx="68" cy="28" r="5" fill="none" stroke="#E81312" strokeWidth="2"/>
          </svg>
        </Box>
        <Typography variant="h4" fontFamily="Georgia, serif" fontWeight="bold" textAlign="center" sx={{ mb: 1 }}>
          Universidad de la Amazonia
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.8, textAlign: "center", maxWidth: 300 }}>
          Sistema de Reporte de Incidentes Institucionales
        </Typography>
        <Box sx={{ mt: 4, display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
          {["💧 Fugas de agua", "⚡ Problemas eléctricos", "🏗️ Infraestructura", "🔒 Seguridad"].map(t => (
            <Box key={t} sx={{
              bgcolor: "rgba(255,255,255,0.15)", borderRadius: 2,
              px: 2, py: 1, fontSize: "0.85rem", backdropFilter: "blur(4px)"
            }}>{t}</Box>
          ))}
        </Box>
      </Box>

      {/* Panel derecho - formulario */}
      <Box sx={{
        width: { xs: "100%", md: 480 },
        display: "flex", alignItems: "center", justifyContent: "center",
        bgcolor: "#fafafa", p: 4
      }}>
        <Paper elevation={0} sx={{ width: "100%", maxWidth: 380, p: 4 }}>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Box sx={{
              width: 64, height: 64, borderRadius: "50%",
              bgcolor: "#0B750E", display: "inline-flex",
              alignItems: "center", justifyContent: "center", mb: 2
            }}>
              <Typography sx={{ color: "white", fontWeight: "bold", fontSize: 22, fontFamily: "serif" }}>UA</Typography>
            </Box>
            <Typography variant="h5" fontWeight="bold" color="#222222">Iniciar Sesión</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Ingresa con tu cuenta institucional
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleLogin} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              label="Correo electrónico"
              type="email"
              value={correo}
              onChange={e => setCorreo(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start"><EmailOutlined sx={{ color: "#0B750E" }} /></InputAdornment>
              }}
              sx={{ "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#0B750E" } }}
            />
            <TextField
              label="Contraseña"
              type={mostrarPass ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start"><LockOutlined sx={{ color: "#0B750E" }} /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setMostrarPass(!mostrarPass)}>
                      {mostrarPass ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#0B750E" } }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={cargando}
              sx={{
                bgcolor: "#0B750E", py: 1.5, fontSize: "1rem",
                "&:hover": { bgcolor: "#064d08" },
                borderRadius: 2
              }}
            >
              {cargando ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Ingresar"}
            </Button>
          </Box>

          <Typography variant="body2" textAlign="center" sx={{ mt: 3, color: "text.secondary" }}>
            ¿No tienes cuenta?{" "}
            <Link to="/register" style={{ color: "#0B750E", fontWeight: "bold", textDecoration: "none" }}>
              Regístrate aquí
            </Link>
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
