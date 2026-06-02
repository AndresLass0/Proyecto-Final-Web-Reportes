import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../FireBase/config";
import Swal from "sweetalert2";
import {
  Box, TextField, Button, Typography, InputAdornment,
  IconButton, CircularProgress, Paper, Divider
} from "@mui/material";
import { Visibility, VisibilityOff, EmailOutlined, LockOutlined } from "@mui/icons-material";

export default function Home() {
  const { iniciarSesion, iniciarSesionGoogle } = useAuth();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPass, setMostrarPass] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    if (!correo || !password) {
      Swal.fire({ icon: "warning", title: "Campos incompletos", text: "Todos los campos son obligatorios", confirmButtonColor: "#0B750E" });
      return;
    }
    setCargando(true);
    try {
      const cred = await iniciarSesion(correo, password);
      const snap = await getDoc(doc(db, "usuarios", cred.user.uid));
      const rol = snap.data()?.rol;
      await Swal.fire({ icon: "success", title: "¡Bienvenido!", text: `Hola ${cred.user.displayName || correo}`, timer: 1500, showConfirmButton: false });
      navigate(rol === "administrador" ? "/admin" : "/usuario");
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error de acceso", text: "Correo o contraseña incorrectos", confirmButtonColor: "#E81312" });
    } finally {
      setCargando(false);
    }
  }

  async function handleGoogle() {
    try {
      const { user, rol } = await iniciarSesionGoogle();
      await Swal.fire({ icon: "success", title: "¡Bienvenido!", text: `Hola ${user.displayName || user.email}`, timer: 1500, showConfirmButton: false });
      navigate(rol === "administrador" ? "/admin" : "/usuario");
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: "No se pudo iniciar sesión con Google", confirmButtonColor: "#E81312" });
    }
  }  return (
    <Box className="flow-gradient-bg" sx={{
      minHeight: "100vh", display: "flex",
    }}>
      <Box className="slide-up-in stagger-1" sx={{
        flex: 1, display: { xs: "none", md: "flex" },
        flexDirection: "column", alignItems: "center", justifyContent: "center",
        p: 6, color: "white"
      }}>
        <Box sx={{ mb: 3 }}>
          <svg width="120" height="100" viewBox="0 0 120 100">
            <text x="5" y="80" fontSize="75" fontFamily="Outfit, sans-serif" fontWeight="bold" fill="#ffffff" opacity="0.9">UA</text>
            <ellipse cx="95" cy="18" rx="20" ry="9" fill="#E81312" opacity="0.9"/>
            <circle cx="76" cy="22" r="5" fill="none" stroke="#E81312" strokeWidth="2"/>
          </svg>
        </Box>
        <Typography variant="h4" fontWeight="bold" textAlign="center" sx={{ mb: 1 }}>
          Universidad de la Amazonia
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.8, textAlign: "center", maxWidth: 320 }}>
          Sistema de Reporte de Incidentes Institucionales
        </Typography>
        <Box sx={{ mt: 4, display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
          {["💧 Fugas de agua", "⚡ Problemas eléctricos", "🏗️ Infraestructura", "🔒 Seguridad"].map(t => (
            <Box key={t} sx={{ bgcolor: "rgba(255,255,255,0.12)", backdropFilter: "blur(4px)", borderRadius: 2, px: 2, py: 1, fontSize: "0.85rem", border: "1px solid rgba(255,255,255,0.15)", transition: "transform 0.2s", "&:hover": { transform: "translateY(-2px)" } }}>{t}</Box>
          ))}
        </Box>
      </Box>
 
      <Box sx={{ width: { xs: "100%", md: 480 }, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "rgba(0,0,0,0.15)", backdropFilter: "blur(10px)", borderLeft: "1px solid rgba(255,255,255,0.08)", p: 4 }}>
        <Paper className="glass-panel slide-from-left stagger-1" elevation={4} sx={{ width: "100%", maxWidth: 380, p: 4, borderRadius: 4 }}>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Box sx={{ width: 64, height: 64, borderRadius: "50%", bgcolor: "#0B750E", display: "inline-flex", alignItems: "center", justifyContent: "center", mb: 2, boxShadow: "0 4px 14px rgba(11, 117, 14, 0.4)" }}>
              <Typography sx={{ color: "white", fontWeight: "bold", fontSize: 22 }}>UA</Typography>
            </Box>
            <Typography variant="h5" fontWeight="bold" color="#222222">Iniciar Sesión</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Ingresa con tu cuenta institucional</Typography>
          </Box>
 
          <Box component="form" onSubmit={handleLogin} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              label="Correo electrónico" type="email" value={correo}
              onChange={e => setCorreo(e.target.value)} fullWidth
              InputProps={{ startAdornment: <InputAdornment position="start"><EmailOutlined sx={{ color: "#0B750E" }} /></InputAdornment> }}
              sx={{ "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#0B750E" } }}
            />
            <TextField
              label="Contraseña" type={mostrarPass ? "text" : "password"} value={password}
              onChange={e => setPassword(e.target.value)} fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start"><LockOutlined sx={{ color: "#0B750E" }} /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setMostrarPass(!mostrarPass)} size="small">
                      {mostrarPass ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#0B750E" } }}
            />
            <Button type="submit" variant="contained" fullWidth disabled={cargando} className="btn-interactive"
              sx={{ bgcolor: "#0B750E", py: 1.5, fontSize: "1rem", "&:hover": { bgcolor: "#064d08" }, borderRadius: 2, boxShadow: "0 4px 12px rgba(11, 117, 14, 0.3)" }}>
              {cargando ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Ingresar"}
            </Button>
          </Box>
 
          <Divider sx={{ my: 2, "&::before, &::after": { borderColor: "rgba(0,0,0,0.12)" } }}>o</Divider>
 
          <Button
            variant="outlined" fullWidth onClick={handleGoogle} className="btn-interactive"
            startIcon={
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
                <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
                <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
              </svg>
            }
            sx={{ borderColor: "rgba(0,0,0,0.15)", color: "#444", "&:hover": { borderColor: "rgba(0,0,0,0.25)", bgcolor: "rgba(0,0,0,0.02)" }, borderRadius: 2, py: 1.2 }}
          >
            Continuar con Google
          </Button>
 
          <Typography variant="body2" textAlign="center" sx={{ mt: 3, color: "text.secondary" }}>
            ¿No tienes cuenta?{" "}
            <Link to="/register" style={{ color: "#0B750E", fontWeight: "bold", textDecoration: "none" }}>Regístrate aquí</Link>
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
