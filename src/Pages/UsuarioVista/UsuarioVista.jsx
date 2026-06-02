import { useState, useEffect, useRef } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../FireBase/config";
import { useAuth } from "../../context/AuthContext";
import { loadGoogleMaps } from "../../utils/googleMaps";
import FormularioIncidente from "../../components/FormularioIncidente/FormularioIncidente";
import {
  Box, Typography, Button, Chip, Card, CardContent,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Dialog, DialogContent, DialogTitle, IconButton, AppBar,
  Toolbar, Avatar, Divider
} from "@mui/material";
import {
  Add, Close, Search, Logout, ReportProblem,
  CheckCircle, Schedule, PendingActions
} from "@mui/icons-material";

const ESTADO_CONFIG = {
  "Reportado":   { color: "#E81312", bg: "#fde8e8", icon: <ReportProblem sx={{ fontSize: 16 }} /> },
  "En proceso":  { color: "#E47113", bg: "#fef3e2", icon: <Schedule sx={{ fontSize: 16 }} /> },
  "Resuelto":    { color: "#0B750E", bg: "#e8f5e9", icon: <CheckCircle sx={{ fontSize: 16 }} /> },
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

  return (
    <Box className="flow-gradient-bg" sx={{ minHeight: "100vh", pb: 5 }}>
      {/* AppBar */}
      <AppBar className="slide-from-top" position="static" sx={{ bgcolor: "rgba(11, 117, 14, 0.15)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(255,255,255,0.08)", boxShadow: "none" }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: "bold", color: "white" }}>
             UA Incidentes
          </Typography>
          <Typography variant="body2" sx={{ mr: 2, display: { xs: "none", sm: "block" }, color: "rgba(255,255,255,0.8)" }}>
            {usuario?.displayName || usuario?.email}
          </Typography>
          <Avatar sx={{ bgcolor: "#E81312", mr: 1, width: 36, height: 36, fontSize: 14 }}>
            {(usuario?.displayName || usuario?.email || "U")[0].toUpperCase()}
          </Avatar>
          <IconButton color="inherit" onClick={cerrarSesion} title="Cerrar sesión" sx={{ color: "white" }}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 900, mx: "auto", p: 3 }}>
        {/* Estadísticas rápidas */}
        <Box className="slide-up-in stagger-1" sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 3 }}>
          {[
            { label: "Total", value: conteos.total, color: "#ffffff" },
            { label: "Reportados", value: conteos.reportado, color: "#ff8a80" },
            { label: "En Proceso", value: conteos.enProceso, color: "#ffd180" },
            { label: "Resueltos", value: conteos.resuelto, color: "#b9f6ca" },
          ].map(s => (
            <Card key={s.label} className="glass-panel btn-interactive" elevation={0} sx={{ borderRadius: 3, textAlign: "center", py: 1, border: "1px solid rgba(255,255,255,0.12)" }}>
              <CardContent sx={{ py: "12px !important" }}>
                <Typography variant="h4" fontWeight="bold" sx={{ color: s.color }}>{s.value}</Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>{s.label}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Barra de acciones */}
        <Box className="slide-up-in stagger-2" sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", alignItems: "center" }}>
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
              flexGrow: 1, minWidth: 200,
              "& .MuiOutlinedInput-root": {
                bgcolor: "rgba(255,255,255,0.06)",
                "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
                "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                "&.Mui-focused fieldset": { borderColor: "#0B750E" },
              },
              "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.6)" }
            }}
          />
          <FormControl size="small" sx={{ 
            minWidth: 140,
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
            sx={{ bgcolor: "#0B750E", "&:hover": { bgcolor: "#064d08" }, borderRadius: 2, px: 2.5, py: 1.1, boxShadow: "0 4px 14px rgba(11, 117, 14, 0.4)" }}
          >
            Nuevo Incidente
          </Button>
        </Box>

        {/* Lista de incidentes */}
        {incidentesFiltrados.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8, color: "rgba(255,255,255,0.7)" }}>
            <PendingActions sx={{ fontSize: 60, opacity: 0.3, mb: 2 }} />
            <Typography>No hay incidentes registrados</Typography>
            <Button
              variant="outlined"
              className="btn-interactive"
              sx={{ mt: 2, borderColor: "#b9f6ca", color: "#b9f6ca", borderRadius: 2, "&:hover": { borderColor: "white", bgcolor: "rgba(255,255,255,0.05)" } }}
              onClick={() => setMostrarFormulario(true)}
            >
              Reportar mi primer incidente
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {incidentesFiltrados.map((inc, idx) => {
              const cfg = ESTADO_CONFIG[inc.estado] || ESTADO_CONFIG["Reportado"];
              return (
                <Box key={inc.id} className={`slide-up-in stagger-${(idx % 6) + 1}`}>
                  <Card
                    className={`glass-panel hover-card-premium hover-card-${inc.estado === "En proceso" ? "proceso" : inc.estado === "Resuelto" ? "resuelto" : "reportado"}`}
                    elevation={0}
                    sx={{ borderRadius: 3, cursor: "pointer", border: "1px solid rgba(255,255,255,0.12)" }}
                    onClick={() => setIncidenteSeleccionado(inc)}
                  >
                    <CardContent sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                      {inc.imagenURL && (
                        <Box sx={{ width: 80, height: 80, borderRadius: 2, overflow: "hidden", flexShrink: 0, border: "1px solid rgba(255,255,255,0.15)" }}>
                          <img src={inc.imagenURL} alt="incidente" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </Box>
                      )}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                          <Typography fontWeight="bold" noWrap sx={{ color: "white" }}>{inc.tipo}</Typography>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <span className={`led-indicator led-${inc.estado === "En proceso" ? "orange" : inc.estado === "Resuelto" ? "green" : "red"}`}></span>
                            <Chip
                              label={inc.estado}
                              size="small"
                              icon={cfg.icon}
                              sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: "bold", fontSize: "0.7rem" }}
                            />
                          </Box>
                        </Box>
                        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)", mb: 0.5 }} noWrap>
                          {inc.descripcion}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.55)" }}>
                           {inc.ubicacionTexto} · {inc.fechaCreacion?.toDate?.()?.toLocaleDateString("es-CO") || "Fecha no disponible"}
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
        <DialogTitle sx={{ bgcolor: "#0B750E", color: "white", display: "flex", justifyContent: "space-between" }}>
          Reportar Incidente
          <IconButton onClick={() => setMostrarFormulario(false)} sx={{ color: "white" }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormularioIncidente onCerrar={() => setMostrarFormulario(false)} />
        </DialogContent>
      </Dialog>

      {/* Modal detalle */}
      <Dialog open={!!incidenteSeleccionado} onClose={() => setIncidenteSeleccionado(null)} PaperProps={{ className: "scale-in" }} maxWidth="sm" fullWidth>
        {incidenteSeleccionado && (() => {
          const cfg = ESTADO_CONFIG[incidenteSeleccionado.estado] || ESTADO_CONFIG["Reportado"];
          return (
            <>
              <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography fontWeight="bold">{incidenteSeleccionado.tipo}</Typography>
                  <Chip label={incidenteSeleccionado.estado} size="small" sx={{ bgcolor: cfg.bg, color: cfg.color, mt: 0.5 }} />
                </Box>
                <IconButton onClick={() => setIncidenteSeleccionado(null)}><Close /></IconButton>
              </DialogTitle>
              <DialogContent>
                {incidenteSeleccionado.imagenURL && (
                  <Box sx={{ mb: 2, borderRadius: 2, overflow: "hidden" }}>
                    <img src={incidenteSeleccionado.imagenURL} alt="incidente" style={{ width: "100%", maxHeight: 300, objectFit: "cover" }} />
                  </Box>
                )}
                <Typography variant="body1" sx={{ mb: 1 }}>{incidenteSeleccionado.descripcion}</Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2" color="text.secondary">📍 {incidenteSeleccionado.ubicacionTexto}</Typography>
                {incidenteSeleccionado.latitud && incidenteSeleccionado.longitud && (
                  <Box sx={{ mt: 1.5, mb: 1.5 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: "bold" }}>
                      📍 Ubicación Georreferenciada:
                    </Typography>
                    <div ref={mapDetailRef} style={{ width: "100%", height: "200px", borderRadius: "8px", border: "1px solid #ccc" }} />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                      Coordenadas: {incidenteSeleccionado.latitud.toFixed(6)}, {incidenteSeleccionado.longitud.toFixed(6)}
                    </Typography>
                  </Box>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                   {incidenteSeleccionado.fechaCreacion?.toDate?.()?.toLocaleString("es-CO") || ""}
                </Typography>
                {incidenteSeleccionado.historialEstados?.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold">Historial de estados:</Typography>
                    {incidenteSeleccionado.historialEstados.map((h, i) => (
                      <Typography key={i} variant="caption" display="block" color="text.secondary">
                        • {h.estado} — {new Date(h.fecha).toLocaleString("es-CO")} <br/>
                      </Typography>
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
