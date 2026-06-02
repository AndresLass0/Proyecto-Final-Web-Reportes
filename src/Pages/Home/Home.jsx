import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import uaisoLogo from "../../assets/UAIso.png";
import uaOriginalLogo from "../../assets/UAOriginal.png";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../FireBase/config";
import Swal from "sweetalert2";
import {
  Box, TextField, Button, Typography, InputAdornment,
  IconButton, CircularProgress, Paper, Divider
} from "@mui/material";
import {
  Visibility, VisibilityOff, EmailOutlined, LockOutlined,
  WaterDrop, Bolt, Construction, Security as ShieldIcon,
  KeyboardArrowDown, TouchApp, Speed, DoneAll
} from "@mui/icons-material";

export default function Home() {
  const { iniciarSesion, iniciarSesionGoogle } = useAuth();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPass, setMostrarPass] = useState(false);
  const [cargando, setCargando] = useState(false);

  const portalRef = useRef(null);

  const scrollAPortal = () => {
    portalRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  async function handleLogin(e) {
    e.preventDefault();
    if (!correo || !password) {
      Swal.fire({ icon: "warning", title: "Campos incompletos", text: "Todos los campos son obligatorios", confirmButtonColor: "#10b981" });
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
      Swal.fire({ icon: "error", title: "Error de acceso", text: "Correo o contraseña incorrectos", confirmButtonColor: "#ef4444" });
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
      Swal.fire({ icon: "error", title: "Error", text: "No se pudo iniciar sesión con Google", confirmButtonColor: "#ef4444" });
    }
  }

  // Controlador de eventos para el efecto 3D Tilt
  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const rotateX = ((yc - y) / yc) * 12; // Inclinación en X
    const rotateY = ((x - xc) / xc) * 12; // Inclinación en Y

    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);
    card.style.setProperty("--rotate-x", `${-rotateX}deg`);
    card.style.setProperty("--rotate-y", `${rotateY}deg`);
  };

  const handleMouseLeave = (e) => {
    const card = e.currentTarget;
    card.style.setProperty("--rotate-x", `0deg`);
    card.style.setProperty("--rotate-y", `0deg`);
  };

  return (
    <Box sx={{ bgcolor: "#08090d", minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      {/* Luces flotantes ambientales de fondo */}
      <div className="ambient-glow-1" />
      <div className="ambient-glow-2" />
      <div className="ambient-glow-3" />

      {/* ==========================================
          SECCIÓN 1: HERO (Apple Style Landing)
          ========================================== */}
      <Box sx={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        justifyContent: "space-between", alignItems: "center", p: 4, position: "relative", zIndex: 1
      }}>
        {/* Barra superior minimalista */}
        <Box className="slide-from-top" sx={{ display: "flex", width: "100%", maxWidth: 1200, justifyContent: "space-between", alignItems: "center", py: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <img src={uaOriginalLogo} alt="UA Logo" style={{ width: 44, height: "auto", filter: "drop-shadow(0 0 10px rgba(16,185,129,0.3))" }} />
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: "-0.03em", color: "white", fontSize: "1.1rem" }}>
              UA Incidentes
            </Typography>
          </Box>
          <Button variant="outlined" className="btn-interactive" onClick={scrollAPortal}
            sx={{ borderColor: "rgba(255,255,255,0.15)", color: "white", borderRadius: 3, px: 3, "&:hover": { borderColor: "#10b981", bgcolor: "rgba(16,185,129,0.08)" } }}>
            Acceder
          </Button>
        </Box>

        {/* Bloque central de presentación */}
        <Box sx={{ textAlign: "center", maxWidth: 850, px: 2, my: "auto" }}>
          <Typography className="slide-up-in stagger-1" variant="h2" sx={{
            fontWeight: 900,
            fontSize: { xs: "2.4rem", sm: "3.6rem", md: "4.5rem" },
            lineHeight: 1.1,
            mb: 3,
            background: "linear-gradient(135deg, #ffffff 30%, #a7f3d0 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.03em"
          }}>
            Un campus inteligente, <br />
            gestionado por todos.
          </Typography>

          <Typography className="slide-up-in stagger-2" variant="h6" sx={{
            color: "rgba(255,255,255,0.65)", fontWeight: 400, maxWidth: 620, mx: "auto", mb: 5,
            fontSize: { xs: "0.95rem", sm: "1.15rem" }, lineHeight: 1.6
          }}>
            Reporta incidentes institucionales al instante, georreferencia su ubicación y monitorea la solución en tiempo real. Transformemos nuestro campus juntos.
          </Typography>

          <Box className="slide-up-in stagger-3" sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap", mb: 6 }}>
            <Button variant="contained" className="btn-interactive" onClick={scrollAPortal}
              sx={{ bgcolor: "#10b981", px: 4, py: 1.8, fontSize: "1rem", borderRadius: 3, "&:hover": { bgcolor: "#059669" }, boxShadow: "0 10px 25px rgba(16,185,129,0.4)" }}>
              Reportar un Incidente
            </Button>
            <Button variant="outlined" className="btn-interactive" onClick={() => navigate("/register")}
              sx={{ borderColor: "rgba(255,255,255,0.15)", color: "white", px: 4, py: 1.8, fontSize: "1rem", borderRadius: 3, "&:hover": { borderColor: "white", bgcolor: "rgba(255,255,255,0.04)" } }}>
              Crear Cuenta
            </Button>
          </Box>

          {/* Tarjetas 3D Tilt de categorías */}
          <Box className="slide-up-in stagger-4" sx={{ display: "flex", gap: 2.5, flexWrap: "wrap", justifyContent: "center", mt: 4 }}>
            {[
              { icon: <WaterDrop sx={{ fontSize: 24, color: "#38bdf8" }} />, label: "Fugas de agua", desc: "Reporta tuberías rotas y goteras" },
              { icon: <Bolt sx={{ fontSize: 24, color: "#fbbf24" }} />, label: "Daños eléctricos", desc: "Problemas de iluminación o redes" },
              { icon: <Construction sx={{ fontSize: 24, color: "#10b981" }} />, label: "Infraestructura", desc: "Averías en aulas y pasillos" },
              { icon: <ShieldIcon sx={{ fontSize: 24, color: "#f87171" }} />, label: "Seguridad UA", desc: "Cerraduras dañadas y zonas de riesgo" },
            ].map(({ icon, label, desc }) => (
              <Box
                key={label}
                className="hover-card-premium glass-panel"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                sx={{
                  display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1.5,
                  borderRadius: 4, p: 3, width: 220, textAlign: "left", cursor: "pointer",
                  border: "1px solid rgba(255,255,255,0.08)", transition: "all 0.3s ease"
                }}
              >
                <Box sx={{ p: 1.2, bgcolor: "rgba(255,255,255,0.04)", borderRadius: 3, display: "flex" }}>
                  {icon}
                </Box>
                <Typography variant="body1" fontWeight="700" sx={{ color: "white" }}>{label}</Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>{desc}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Indicador de scroll */}
        <Box className="slide-up-in stagger-5" sx={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", mt: 4 }} onClick={scrollAPortal}>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.35)", letterSpacing: "0.2em", textTransform: "uppercase", mb: 0.5, fontSize: "0.7rem" }}>
            Desliza para acceder
          </Typography>
          <KeyboardArrowDown sx={{ color: "rgba(255,255,255,0.4)", animation: "bounce 2s infinite" }} />
        </Box>
      </Box>

      {/* ==========================================
          SECCIÓN 2: STORYTELLING (Tesla Flow Vibe)
          ========================================== */}
      <Box sx={{ py: 14, px: 4, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}>
        <Typography variant="h3" textAlign="center" sx={{ fontWeight: 800, mb: 8, letterSpacing: "-0.02em", color: "white" }}>
          Un proceso ágil y transparente
        </Typography>

        <Box sx={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center", maxWidth: 1000 }}>
          {[
            { step: "01", icon: <TouchApp sx={{ fontSize: 32, color: "#10b981" }} />, title: "Reporta al Instante", desc: "Toma una foto del incidente, selecciona la categoría y marca las coordenadas geográficas exactas en el mapa interconectado." },
            { step: "02", icon: <Speed sx={{ fontSize: 32, color: "#fbbf24" }} />, title: "Gestión Automatizada", desc: "El sistema alerta a los administradores institucionales en tiempo real para evaluar, catalogar e iniciar la reparación del problema." },
            { step: "03", icon: <DoneAll sx={{ fontSize: 32, color: "#38bdf8" }} />, title: "Resolución Visible", desc: "Recibe actualizaciones continuas de estado. Monitorea el historial de estados hasta que el campus quede 100% restablecido." },
          ].map(({ step, icon, title, desc }) => (
            <Box key={step} sx={{ flex: 1, minWidth: 280, maxWidth: 320, p: 4, bgcolor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 5, position: "relative" }}>
              <Typography variant="h1" sx={{ position: "absolute", top: -20, right: 20, fontSize: "4.5rem", fontWeight: 900, color: "rgba(16,185,129,0.06)", userSelect: "none" }}>{step}</Typography>
              <Box sx={{ mb: 2, display: "flex", alignItems: "center" }}>
                {icon}
              </Box>
              <Typography variant="h6" fontWeight="bold" sx={{ color: "white", mb: 1.5 }}>{title}</Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>{desc}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ==========================================
          SECCIÓN 3: LOGIN PORTAL (Stripe Glassmorphism)
          ========================================== */}
      <Box ref={portalRef} sx={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        px: 2, py: 8, position: "relative", zIndex: 1, borderTop: "1px solid rgba(255,255,255,0.04)",
        background: "radial-gradient(circle at center, rgba(16,185,129,0.03) 0%, transparent 70%)"
      }}>
        <Paper
          className="glass-panel"
          elevation={0}
          sx={{
            width: "100%", maxWidth: 430, p: { xs: 4, sm: 5 }, borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.1) !important",
            background: "rgba(10, 11, 16, 0.72) !important",
            boxShadow: "0 30px 70px rgba(0,0,0,0.55) !important"
          }}
        >
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Box sx={{ mb: 2, display: "inline-flex", p: 1.5, bgcolor: "rgba(16,185,129,0.08)", borderRadius: "20px" }}>
              <img src={uaisoLogo} alt="UA Logo" style={{ width: 80, height: "auto" }} />
            </Box>
            <Typography variant="h5" fontWeight="bold" sx={{ color: "white", letterSpacing: "-0.01em" }}>Iniciar Sesión</Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)", mt: 0.5 }}>Ingresa con tu cuenta universitaria institucional</Typography>
          </Box>

          <Box component="form" onSubmit={handleLogin} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              label="Correo electrónico" type="email" value={correo}
              onChange={e => setCorreo(e.target.value)} fullWidth
              InputProps={{ startAdornment: <InputAdornment position="start"><EmailOutlined sx={{ color: "#10b981" }} /></InputAdornment> }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                  "&:hover fieldset": { borderColor: "rgba(255,255,255,0.25)" },
                  "&.Mui-focused fieldset": { borderColor: "#10b981" },
                }
              }}
            />
            <TextField
              label="Contraseña" type={mostrarPass ? "text" : "password"} value={password}
              onChange={e => setPassword(e.target.value)} fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start"><LockOutlined sx={{ color: "#10b981" }} /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setMostrarPass(!mostrarPass)} size="small" sx={{ color: "rgba(255,255,255,0.4)" }}>
                      {mostrarPass ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                  "&:hover fieldset": { borderColor: "rgba(255,255,255,0.25)" },
                  "&.Mui-focused fieldset": { borderColor: "#10b981" },
                }
              }}
            />
            <Button type="submit" variant="contained" fullWidth disabled={cargando} className="btn-interactive"
              sx={{ bgcolor: "#10b981", py: 1.6, fontSize: "1rem", fontWeight: "bold", "&:hover": { bgcolor: "#059669" }, borderRadius: 3, boxShadow: "0 8px 24px rgba(16, 185, 129, 0.3)" }}>
              {cargando ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Ingresar"}
            </Button>
          </Box>

          <Divider sx={{ my: 3.5, "&::before, &::after": { borderColor: "rgba(255,255,255,0.08)" } }}>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.3)" }}>o continuar con</Typography>
          </Divider>

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
            sx={{
              borderColor: "rgba(255,255,255,0.12)", color: "white", borderRadius: 3, py: 1.4,
              "&:hover": { borderColor: "rgba(255,255,255,0.3)", bgcolor: "rgba(255,255,255,0.03)" }
            }}
          >
            Google
          </Button>

          <Typography variant="body2" textAlign="center" sx={{ mt: 3.5, color: "rgba(255,255,255,0.5)" }}>
            ¿No tienes una cuenta?{" "}
            <Link to="/register" style={{ color: "#10b981", fontWeight: "bold", textDecoration: "none" }}>Regístrate aquí</Link>
          </Typography>
        </Paper>
      </Box>

      {/* Estilos locales de soporte para bounce y animaciones */}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }
      `}</style>
    </Box>
  );
}
