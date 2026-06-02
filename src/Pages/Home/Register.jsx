import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Swal from "sweetalert2";
import {
  Box, TextField, Button, Typography, InputAdornment,
  IconButton, CircularProgress, Paper
} from "@mui/material";
import { Visibility, VisibilityOff, EmailOutlined, LockOutlined, PersonOutlined } from "@mui/icons-material";

export default function Register() {
  const { registrar } = useAuth();
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

  const fieldSx = { "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#0B750E" } };

  return (
    <Box sx={{
      minHeight: "100vh", display: "flex",
      background: "linear-gradient(135deg, #0B750E 0%, #064d08 50%, #1a1a1a 100%)",
      alignItems: "center", justifyContent: "center", p: 2
    }}>
      <Paper elevation={3} sx={{ width: "100%", maxWidth: 420, p: 4, borderRadius: 3 }}>
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Box sx={{ width: 64, height: 64, borderRadius: "50%", bgcolor: "#0B750E", display: "inline-flex", alignItems: "center", justifyContent: "center", mb: 2 }}>
            <Typography sx={{ color: "white", fontWeight: "bold", fontSize: 22, fontFamily: "serif" }}>UA</Typography>
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

          <Button type="submit" variant="contained" fullWidth disabled={cargando}
            sx={{ bgcolor: "#0B750E", py: 1.5, fontSize: "1rem", "&:hover": { bgcolor: "#064d08" }, borderRadius: 2, mt: 1 }}>
            {cargando ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Registrarse"}
          </Button>
        </Box>

        <Typography variant="body2" textAlign="center" sx={{ mt: 3, color: "text.secondary" }}>
          ¿Ya tienes cuenta?{" "}
          <Link to="/" style={{ color: "#0B750E", fontWeight: "bold", textDecoration: "none" }}>Inicia sesión</Link>
        </Typography>
      </Paper>
    </Box>
  );
}
