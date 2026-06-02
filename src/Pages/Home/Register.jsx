import { useState } from "react";
import uaNegroLogo from "../../assets/UANegro.png";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Swal from "sweetalert2";
import {
  Box, TextField, Button, Typography, InputAdornment,
  IconButton, CircularProgress, Paper, Divider
} from "@mui/material";
import { Visibility, VisibilityOff, EmailOutlined, LockOutlined, PersonOutlined } from "@mui/icons-material";

export default function Register() {
  const { registrar, iniciarSesionGoogle } = useAuth();
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mostrarPass, setMostrarPass] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    if (!nombre || !correo || !password || !confirmar) {
      Swal.fire({ icon: "warning", title: "Campos incompletos", text: "Todos los campos son obligatorios", confirmButtonColor: "#0B750E" });
      return;
    }
    if (password !== confirmar) {
      Swal.fire({ icon: "warning", title: "Contraseñas distintas", text: "Las contraseñas no coinciden", confirmButtonColor: "#0B750E" });
      return;
    }
    if (password.length < 6) {
      Swal.fire({ icon: "warning", title: "Contraseña muy corta", text: "Debe tener al menos 6 caracteres", confirmButtonColor: "#0B750E" });
      return;
    }
    setCargando(true);
    try {
      await registrar(nombre, correo, password);
      await Swal.fire({
        icon: "success",
        title: "¡Cuenta creada!",
        text: "Tu cuenta fue creada exitosamente. Ahora inicia sesión.",
        confirmButtonColor: "#0B750E",
        confirmButtonText: "Ir al login"
      });
      navigate("/");
    } catch (err) {
      const msg = err.code === "auth/email-already-in-use"
        ? "Este correo ya está registrado"
        : "Error al registrar. Intenta de nuevo.";
      Swal.fire({ icon: "error", title: "Error de registro", text: msg, confirmButtonColor: "#E81312" });
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
      Swal.fire({ icon: "error", title: "Error", text: "No se pudo registrar con Google", confirmButtonColor: "#E81312" });
    }
  }

  const fieldSx = { "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#0B750E" } };

  return (
    <Box className="flow-gradient-bg" sx={{
      minHeight: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center", p: 2
    }}>
      <Paper className="glass-panel slide-from-right stagger-1" elevation={4} sx={{ width: "100%", maxWidth: 420, p: 4, borderRadius: 4 }}>
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Box sx={{ mb: 2 }}>
            <img src={uaNegroLogo} alt="UA Logo" style={{ width: 110, height: "auto" }} />
          </Box>
          <Typography variant="h5" fontWeight="bold" color="#222222">Crear Cuenta</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Universidad de la Amazonia</Typography>
        </Box>

        <Box component="form" onSubmit={handleRegister} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField label="Nombre completo" value={nombre} onChange={e => setNombre(e.target.value)} fullWidth
            InputProps={{ startAdornment: <InputAdornment position="start"><PersonOutlined sx={{ color: "#0B750E" }} /></InputAdornment> }} sx={fieldSx} />

          <TextField label="Correo electrónico" type="email" value={correo} onChange={e => setCorreo(e.target.value)} fullWidth
            InputProps={{ startAdornment: <InputAdornment position="start"><EmailOutlined sx={{ color: "#0B750E" }} /></InputAdornment> }} sx={fieldSx} />

          <TextField label="Contraseña" type={mostrarPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} fullWidth
            InputProps={{
              startAdornment: <InputAdornment position="start"><LockOutlined sx={{ color: "#0B750E" }} /></InputAdornment>,
              endAdornment: <InputAdornment position="end"><IconButton onClick={() => setMostrarPass(!mostrarPass)} size="small">{mostrarPass ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>
            }} sx={fieldSx} />

          <TextField label="Confirmar contraseña" type={mostrarConfirmar ? "text" : "password"} value={confirmar} onChange={e => setConfirmar(e.target.value)} fullWidth
            InputProps={{
              startAdornment: <InputAdornment position="start"><LockOutlined sx={{ color: "#0B750E" }} /></InputAdornment>,
              endAdornment: <InputAdornment position="end"><IconButton onClick={() => setMostrarConfirmar(!mostrarConfirmar)} size="small">{mostrarConfirmar ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>
            }} sx={fieldSx} />

          <Button type="submit" variant="contained" fullWidth disabled={cargando} className="btn-interactive"
            sx={{ bgcolor: "#0B750E", py: 1.5, fontSize: "1rem", "&:hover": { bgcolor: "#064d08" }, borderRadius: 2, mt: 1, boxShadow: "0 4px 12px rgba(11, 117, 14, 0.3)" }}>
            {cargando ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Registrarse"}
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
          sx={{ borderColor: "rgba(0,0,0,0.15)", color: "#444", "&:hover": { borderColor: "rgba(0,0,0,0.25)", bgcolor: "rgba(0,0,0,0.02)" }, borderRadius: 2, py: 1.2, mb: 1 }}
        >
          Registrarse con Google
        </Button>

        <Typography variant="body2" textAlign="center" sx={{ mt: 2, color: "text.secondary" }}>
          ¿Ya tienes cuenta?{" "}
          <Link to="/" style={{ color: "#0B750E", fontWeight: "bold", textDecoration: "none" }}>Inicia sesión</Link>
        </Typography>
      </Paper>
    </Box>
  );
}
