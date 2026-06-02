import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../../FireBase/config";
import { useAuth } from "../../context/AuthContext";
import FormularioIncidente from "../../components/FormularioIncidente/FormularioIncidente";
import {
  Box, Typography, Button, Chip, Card, CardContent, CardMedia,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Dialog, DialogContent, DialogTitle, IconButton, AppBar,
  Toolbar, Avatar, Divider, Badge
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

  useEffect(() => {
    if (!usuario) return;
    const q = query(
      collection(db, "incidentes"),
      where("usuarioId", "==", usuario.uid),
      orderBy("fechaCreacion", "desc")
    );
    const unsub = onSnapshot(q, snap => {
      setIncidentes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
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
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      {/* AppBar */}
      <AppBar position="static" sx={{ bgcolor: "#0B750E" }}>
        <Toolbar>
          <Typography variant="h6" fontFamily="serif" sx={{ flexGrow: 1, fontWeight: "bold" }}>
             UA Incidentes
          </Typography>
          <Typography variant="body2" sx={{ mr: 2, display: { xs: "none", sm: "block" } }}>
            {usuario?.displayName || usuario?.email}
          </Typography>
          <Avatar sx={{ bgcolor: "#E81312", mr: 1, width: 36, height: 36, fontSize: 14 }}>
            {(usuario?.displayName || usuario?.email || "U")[0].toUpperCase()}
          </Avatar>
          <IconButton color="inherit" onClick={cerrarSesion} title="Cerrar sesión">
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 900, mx: "auto", p: 3 }}>
        {/* Estadísticas rápidas */}
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 3 }}>
          {[
            { label: "Total", value: conteos.total, color: "#222" },
            { label: "Reportados", value: conteos.reportado, color: "#E81312" },
            { label: "En Proceso", value: conteos.enProceso, color: "#E47113" },
            { label: "Resueltos", value: conteos.resuelto, color: "#0B750E" },
          ].map(s => (
            <Card key={s.label} elevation={1} sx={{ borderRadius: 2, textAlign: "center", py: 1 }}>
              <CardContent sx={{ py: "12px !important" }}>
                <Typography variant="h4" fontWeight="bold" sx={{ color: s.color }}>{s.value}</Typography>
                <Typography variant="caption" color="text.secondary">{s.label}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Barra de acciones */}
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", alignItems: "center" }}>
          <TextField
            placeholder="Buscar incidente..."
            size="small"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            InputProps={{ startAdornment: <Search sx={{ mr: 1, color: "#999" }} /> }}
            sx={{ flexGrow: 1, minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Estado</InputLabel>
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
            onClick={() => setMostrarFormulario(true)}
            sx={{ bgcolor: "#0B750E", "&:hover": { bgcolor: "#064d08" }, borderRadius: 2 }}
          >
            Nuevo Incidente
          </Button>
        </Box>

        {/* Lista de incidentes */}
        {incidentesFiltrados.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
            <PendingActions sx={{ fontSize: 60, opacity: 0.3, mb: 2 }} />
            <Typography>No hay incidentes registrados</Typography>
            <Button
              variant="outlined"
              sx={{ mt: 2, borderColor: "#0B750E", color: "#0B750E" }}
              onClick={() => setMostrarFormulario(true)}
            >
              Reportar mi primer incidente
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {incidentesFiltrados.map(inc => {
              const cfg = ESTADO_CONFIG[inc.estado] || ESTADO_CONFIG["Reportado"];
              return (
                <Card
                  key={inc.id}
                  elevation={1}
                  sx={{ borderRadius: 2, cursor: "pointer", "&:hover": { elevation: 4, transform: "translateY(-1px)", transition: "0.2s" }, borderLeft: `4px solid ${cfg.color}` }}
                  onClick={() => setIncidenteSeleccionado(inc)}
                >
                  <CardContent sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                    {inc.imagenURL && (
                      <Box sx={{ width: 80, height: 80, borderRadius: 2, overflow: "hidden", flexShrink: 0 }}>
                        <img src={inc.imagenURL} alt="incidente" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </Box>
                    )}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                        <Typography fontWeight="bold" noWrap>{inc.tipo}</Typography>
                        <Chip
                          label={inc.estado}
                          size="small"
                          icon={cfg.icon}
                          sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: "bold", fontSize: "0.7rem" }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }} noWrap>
                        {inc.descripcion}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                         {inc.ubicacionTexto} · {inc.fechaCreacion?.toDate?.()?.toLocaleDateString("es-CO") || "Fecha no disponible"}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Modal formulario */}
      <Dialog open={mostrarFormulario} onClose={() => setMostrarFormulario(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: "#0B750E", color: "white", display: "flex", justifyContent: "space-between" }}>
          Reportar Incidente
          <IconButton onClick={() => setMostrarFormulario(false)} sx={{ color: "white" }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormularioIncidente onCerrar={() => setMostrarFormulario(false)} />
        </DialogContent>
      </Dialog>

      {/* Modal detalle */}
      <Dialog open={!!incidenteSeleccionado} onClose={() => setIncidenteSeleccionado(null)} maxWidth="sm" fullWidth>
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
                {incidenteSeleccionado.latitud && (
                  <Typography variant="body2" color="text.secondary">
                     {incidenteSeleccionado.latitud.toFixed(5)}, {incidenteSeleccionado.longitud.toFixed(5)}
                  </Typography>
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
