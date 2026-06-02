import { useState, useEffect, useRef } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../FireBase/config";
import { useAuth } from "../../context/AuthContext";
import { loadGoogleMaps } from "../../utils/googleMaps";
import FormularioIncidente from "../../components/FormularioIncidente/FormularioIncidente";
import AnimatedCounter from "../../components/AnimatedCounter";
import {
  Box, Typography, Button, Chip, Card, CardContent,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Dialog, DialogContent, DialogTitle, IconButton, AppBar,
  Toolbar, Avatar, Divider
} from "@mui/material";
import {
  Add, Close, Search, Logout, ReportProblem,
  CheckCircle, Schedule, PendingActions, LocationOn
} from "@mui/icons-material";

const ESTADO_CONFIG = {
  "Reportado":   { color: "#E81312", bg: "#fde8e8", icon: <ReportProblem sx={{ fontSize: 16, color: "#E81312" }} /> },
  "En proceso":  { color: "#E47113", bg: "#fef3e2", icon: <Schedule sx={{ fontSize: 16, color: "#E47113" }} /> },
  "Resuelto":    { color: "#0B750E", bg: "#e8f5e9", icon: <CheckCircle sx={{ fontSize: 16, color: "#0B750E" }} /> },
};

export default function UsuarioVista() {
  const { usuario, cerrarSesion } = useAuth();
  const [incidentes, setIncidentes] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [incidenteSeleccionado, setIncidenteSeleccionado] = useState(null);
  const mapDetailRef = useRef(null);

  useEffect(() => {
    if (!incidenteSeleccionado || !incidenteSeleccionado.latitud || !incidenteSeleccionado.longitud) return;
    const timer = setTimeout(() => {
      if (!mapDetailRef.current) return;
      loadGoogleMaps("AIzaSyAch4GiG6bKokBQK-1h4x3N44So0AYfyRw")
        .then((google) => {
          const pos = { lat: incidenteSeleccionado.latitud, lng: incidenteSeleccionado.longitud };
          const mapObj = new google.maps.Map(mapDetailRef.current, {
            center: pos,
            zoom: 16,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            gestureHandling: "cooperative",
          });
          new google.maps.Marker({
            position: pos,
            map: mapObj,
            title: incidenteSeleccionado.tipo,
          });
        })
        .catch((err) => console.error("Error al cargar mapa de detalle:", err));
    }, 200);
    return () => clearTimeout(timer);
  }, [incidenteSeleccionado]);

  useEffect(() => {
    if (!usuario) return;
    const q = query(
      collection(db, "incidentes"),
      where("usuarioId", "==", usuario.uid)
    );
    const unsub = onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => {
        const timeA = a.fechaCreacion?.toDate ? a.fechaCreacion.toDate().getTime() : (a.fechaCreacion ? new Date(a.fechaCreacion).getTime() : Date.now());
        const timeB = b.fechaCreacion?.toDate ? b.fechaCreacion.toDate().getTime() : (b.fechaCreacion ? new Date(b.fechaCreacion).getTime() : Date.now());
        return timeB - timeA;
      });
      setIncidentes(list);
    }, error => {
      console.error("Error al obtener incidentes del usuario:", error);
    });
    return unsub;
  }, [usuario]);

  const incidentesFiltrados = incidentes.filter(inc => {
    const matchEstado = filtroEstado === "Todos" || inc.estado === filtroEstado;
    const matchBusqueda = inc.tipo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      inc.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
      inc.ubicacionTexto?.toLowerCase().includes(busqueda.toLowerCase());
    return matchEstado && matchBusqueda;
  });

  const conteos = {
    total: incidentes.length,
    reportado: incidentes.filter(i => i.estado === "Reportado").length,
    enProceso: incidentes.filter(i => i.estado === "En proceso").length,
    resuelto: incidentes.filter(i => i.estado === "Resuelto").length,
  };

  // Manejador del efecto 3D Tilt
  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const rotateX = ((yc - y) / yc) * 6; 
    const rotateY = ((x - xc) / xc) * 6;

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
    <Box className="flow-gradient-bg" sx={{ minHeight: "100vh", pb: 5, position: "relative", overflow: "hidden" }}>
      {/* Luces flotantes ambientales de fondo */}
      <div className="ambient-glow-1" />
      <div className="ambient-glow-2" />
      <div className="ambient-glow-3" />

      {/* AppBar */}
      <AppBar className="slide-from-top" position="static" sx={{ bgcolor: "rgba(11, 117, 14, 0.15)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(255,255,255,0.08)", boxShadow: "none" }}>
        <Toolbar sx={{ maxWidth: 1200, width: "100%", mx: "auto" }}>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 900, color: "white", letterSpacing: "-0.03em" }}>
             UA Incidentes
          </Typography>
          <Typography variant="body2" sx={{ mr: 2, display: { xs: "none", sm: "block" }, color: "rgba(255,255,255,0.8)" }}>
            {usuario?.displayName || usuario?.email}
          </Typography>
          <Avatar sx={{ bgcolor: "#E81312", mr: 1, width: 36, height: 36, fontSize: 14, fontWeight: "bold", border: "1px solid rgba(255,255,255,0.12)" }}>
            {(usuario?.displayName || usuario?.email || "U")[0].toUpperCase()}
          </Avatar>
          <IconButton color="inherit" onClick={cerrarSesion} title="Cerrar sesión" sx={{ color: "white", "&:hover": { color: "#ef4444" } }}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 950, mx: "auto", p: { xs: 2, sm: 3 }, position: "relative", zIndex: 1 }}>
        
        {/* Panel de Bienvenida */}
        <Box className="slide-up-in stagger-1" sx={{ mb: 4, mt: 2 }}>
          <Typography variant="h4" fontWeight="800" sx={{ color: "white", letterSpacing: "-0.02em" }}>
            ¡Hola, {(usuario?.displayName || usuario?.email || "").split("@")[0]}!
          </Typography>
          <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.7)" }}>
            Reporta anomalías en el campus y contribuye a mantener una universidad en excelente estado.
          </Typography>
        </Box>

        {/* Estadísticas rápidas */}
        <Box className="slide-up-in stagger-1" sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" }, gap: 2, mb: 4 }}>
          {[
            { label: "Total", value: conteos.total, color: "#ffffff" },
            { label: "Reportados", value: conteos.reportado, color: "#ff8a80" },
            { label: "En Proceso", value: conteos.enProceso, color: "#ffd180" },
            { label: "Resueltos", value: conteos.resuelto, color: "#b9f6ca" },
          ].map(s => (
            <Card
              key={s.label}
              className="glass-panel hover-card-premium"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              elevation={0}
              sx={{
                borderRadius: 4, textAlign: "center", py: 1.5,
                border: "1px solid rgba(255,255,255,0.45) !important",
              }}
            >
              <CardContent sx={{ py: "8px !important" }}>
                <Typography variant="h3" fontWeight="900" sx={{ color: s.color, letterSpacing: "-0.03em" }}>
                  <AnimatedCounter value={s.value} />
                </Typography>
                <Typography variant="caption" sx={{ color: "#000000c9", fontWeight: 600 }}>{s.label}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Barra de acciones */}
        <Box className="slide-up-in stagger-2" sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap", alignItems: "center" }}>
          <TextField
            placeholder="Buscar incidente..."
            size="small"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            InputProps={{ 
              startAdornment: <Search sx={{ mr: 1, color: "rgba(255,255,255,0.6)" }} />,
              style: { color: "white" }
            }}
            sx={{
              flexGrow: 1, minWidth: 260,
              "& .MuiOutlinedInput-root": {
                bgcolor: "rgba(255,255,255,0.06)",
                "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
                "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                "&.Mui-focused fieldset": { borderColor: "#0B750E" },
                "& input": { color: "white" },
                "& input::placeholder": { color: "rgba(255,255,255,0.6)", opacity: 1 },
              }
            }}
          />
          <FormControl size="small" sx={{ 
            minWidth: 150,
            "& .MuiOutlinedInput-root": {
              bgcolor: "rgba(255,255,255,0.06)",
              color: "white",
              "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
              "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
              "&.Mui-focused fieldset": { borderColor: "#0B750E" },
            },
            "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.6)" },
            "& .MuiSelect-icon": { color: "white" }
          }}>
            <InputLabel sx={{ color: "rgba(255,255,255,0.6)" }}>Estado</InputLabel>
            <Select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} label="Estado">
              <MenuItem value="Todos">Todos</MenuItem>
              <MenuItem value="Reportado">Reportado</MenuItem>
              <MenuItem value="En proceso">En proceso</MenuItem>
              <MenuItem value="Resuelto">Resuelto</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<Add />}
            className="btn-interactive"
            onClick={() => setMostrarFormulario(true)}
            sx={{ bgcolor: "#0B750E", "&:hover": { bgcolor: "#064d08" }, borderRadius: 3, px: 3, py: 1.2, fontWeight: "bold", boxShadow: "0 6px 20px rgba(11, 117, 14, 0.3)" }}
          >
            Nuevo Incidente
          </Button>
        </Box>

        {/* Lista de incidentes */}
        {incidentesFiltrados.length === 0 ? (
          <Box className="slide-up-in stagger-3" sx={{ textAlign: "center", py: 10, bgcolor: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.15)", borderRadius: 5 }}>
            <PendingActions sx={{ fontSize: 60, opacity: 0.3, mb: 2, color: "white" }} />
            <Typography sx={{ color: "rgba(255,255,255,0.7)", mb: 2 }}>No se encontraron reportes registrados</Typography>
            <Button
              variant="outlined"
              className="btn-interactive"
              sx={{ borderColor: "#b9f6ca", color: "#b9f6ca", borderRadius: 3, "&:hover": { borderColor: "white", bgcolor: "rgba(255,255,255,0.05)" } }}
              onClick={() => setMostrarFormulario(true)}
            >
              Reportar mi primer incidente
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.2 }}>
            {incidentesFiltrados.map((inc, idx) => {
              const cfg = ESTADO_CONFIG[inc.estado] || ESTADO_CONFIG["Reportado"];
              return (
                <Box key={inc.id} className={`slide-up-in stagger-${(idx % 6) + 1}`}>
                  <Card
                    className={`glass-panel hover-card-premium hover-card-${inc.estado === "En proceso" ? "proceso" : inc.estado === "Resuelto" ? "resuelto" : "reportado"}`}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    elevation={0}
                    sx={{
                      borderRadius: 4, cursor: "pointer",
                      border: "1px solid rgba(255,255,255,0.45) !important",
                      transition: "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)"
                    }}
                    onClick={() => setIncidenteSeleccionado(inc)}
                  >
                    <CardContent sx={{ display: "flex", gap: 3, alignItems: "center", p: "20px !important" }}>
                      {inc.imagenURL && (
                        <Box sx={{ width: 85, height: 85, borderRadius: 3, overflow: "hidden", flexShrink: 0, border: "1px solid rgba(255,255,255,0.3)" }}>
                          <img src={inc.imagenURL} alt="incidente" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </Box>
                      )}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1, flexWrap: "wrap" }}>
                          <Typography variant="h6" fontWeight="bold" noWrap sx={{ color: "#1c1c1f", fontSize: "1.05rem" }}>{inc.tipo}</Typography>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <span className={`led-indicator led-${inc.estado === "En proceso" ? "orange" : inc.estado === "Resuelto" ? "green" : "red"}`}></span>
                            <Chip
                              label={inc.estado}
                              size="small"
                              icon={cfg.icon}
                              sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: "bold", fontSize: "0.72rem" }}
                            />
                          </Box>
                        </Box>
                        <Typography variant="body2" sx={{ color: "#6e6f72", mb: 1, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                          {inc.descripcion}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#6e6f72", display: "flex", alignItems: "center", gap: 0.5 }}>
                          <LocationOn sx={{ fontSize: 13, color: "#0B750E" }} /> {inc.ubicacionTexto} · {inc.fechaCreacion?.toDate?.()?.toLocaleDateString("es-CO") || "Reciente"}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Modal formulario */}
      <Dialog open={mostrarFormulario} onClose={() => setMostrarFormulario(false)} PaperProps={{ className: "scale-in" }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(0,0,0,0.08)", py: 2 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: "#222222" }}>Reportar Incidente</Typography>
          <IconButton onClick={() => setMostrarFormulario(false)} sx={{ color: "rgba(0,0,0,0.5)", "&:hover": { color: "black" } }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5 }}>
          <FormularioIncidente onCerrar={() => setMostrarFormulario(false)} />
        </DialogContent>
      </Dialog>

      {/* Modal detalle */}
      <Dialog open={!!incidenteSeleccionado} onClose={() => setIncidenteSeleccionado(null)} PaperProps={{ className: "scale-in" }} maxWidth="sm" fullWidth>
        {incidenteSeleccionado && (() => {
          const cfg = ESTADO_CONFIG[incidenteSeleccionado.estado] || ESTADO_CONFIG["Reportado"];
          return (
            <>
              <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(0,0,0,0.08)", py: 2 }}>
                <Box>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: "#222222" }}>{incidenteSeleccionado.tipo}</Typography>
                  <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                    <span className={`led-indicator led-${incidenteSeleccionado.estado === "En proceso" ? "orange" : incidenteSeleccionado.estado === "Resuelto" ? "green" : "red"}`}></span>
                    <Chip label={incidenteSeleccionado.estado} size="small" sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: "bold" }} />
                  </Box>
                </Box>
                <IconButton onClick={() => setIncidenteSeleccionado(null)} sx={{ color: "rgba(0,0,0,0.5)", "&:hover": { color: "black" } }}><Close /></IconButton>
              </DialogTitle>
              <DialogContent sx={{ pt: 3 }}>
                {incidenteSeleccionado.imagenURL && (
                  <Box sx={{ mb: 2.5, borderRadius: 4, overflow: "hidden", border: "1px solid rgba(0,0,0,0.1)" }}>
                    <img src={incidenteSeleccionado.imagenURL} alt="incidente" style={{ width: "100%", maxHeight: 280, objectFit: "cover" }} />
                  </Box>
                )}
                <Typography variant="body1" sx={{ color: "#222222", mb: 2, lineHeight: 1.6 }}>{incidenteSeleccionado.descripcion}</Typography>
                <Divider sx={{ my: 2, borderColor: "rgba(0,0,0,0.08)" }} />
                
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 3 }}>
                  <Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 1, color: "#6e6f72" }}>
                    <LocationOn sx={{ fontSize: 18, color: "#0B750E" }} /> 
                    <span>{incidenteSeleccionado.ubicacionTexto}</span>
                  </Typography>
                  {incidenteSeleccionado.latitud && incidenteSeleccionado.longitud && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold", color: "#222222" }}>
                        Ubicación Georreferenciada:
                      </Typography>
                      <div ref={mapDetailRef} style={{ width: "100%", height: "200px", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.12)" }} />
                      <Typography variant="caption" sx={{ mt: 1, display: "block", color: "#6e6f72" }}>
                        Coordenadas: {incidenteSeleccionado.latitud.toFixed(6)}, {incidenteSeleccionado.longitud.toFixed(6)}
                      </Typography>
                    </Box>
                  )}
                  <Typography variant="caption" sx={{ color: "#6e6f72", pl: 0.5 }}>
                    Fecha de reporte: {incidenteSeleccionado.fechaCreacion?.toDate?.()?.toLocaleString("es-CO") || "Reciente"}
                  </Typography>
                </Box>
                
                {incidenteSeleccionado.historialEstados?.length > 0 && (
                  <Box sx={{ mt: 3, p: 2, bgcolor: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.05)", borderRadius: 3 }}>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ color: "#222222", mb: 1.5 }}>Historial de estados:</Typography>
                    {incidenteSeleccionado.historialEstados.map((h, i) => (
                      <Box key={i} sx={{ display: "flex", justifyContent: "space-between", py: 0.5, borderBottom: i < incidenteSeleccionado.historialEstados.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
                        <Typography variant="caption" sx={{ fontWeight: "bold", color: ESTADO_CONFIG[h.estado]?.color || "#222222" }}>• {h.estado}</Typography>
                        <Typography variant="caption" sx={{ color: "#6e6f72" }}>{new Date(h.fecha).toLocaleString("es-CO")}</Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </DialogContent>
            </>
          );
        })()}
      </Dialog>
    </Box>
  );
}
