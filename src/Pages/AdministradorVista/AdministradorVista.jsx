import { useState, useEffect, useRef } from "react";
import {
  collection, query, onSnapshot,
  doc, updateDoc, arrayUnion, writeBatch, getDocs, where
} from "firebase/firestore";
import { db } from "../../FireBase/config";
import { useAuth } from "../../context/AuthContext";
import { loadGoogleMaps } from "../../utils/googleMaps";
import {
  Box, Typography, Button, Chip, Card, CardContent,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Dialog, DialogContent, DialogTitle, IconButton, AppBar,
  Toolbar, Avatar, Divider, Checkbox, Tabs, Tab,
  Badge, Popover, List, ListItem, ListItemText, Snackbar, Alert,
  Collapse
} from "@mui/material";
import {
  Close, Search, Logout, MergeType, BarChart, TableRows,
  NotificationsOutlined, CallSplit
} from "@mui/icons-material";
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

const ESTADOS = ["Reportado", "En proceso", "Resuelto"];
const ESTADO_CONFIG = {
  "Reportado":  { color: "#E81312", bg: "#fde8e8" },
  "En proceso": { color: "#E47113", bg: "#fef3e2" },
  "Resuelto":   { color: "#0B750E", bg: "#e8f5e9" },
};
const COLORES = ["#E81312", "#E47113", "#0B750E", "#005A7E", "#EDB02E", "#169586", "#704595"];

// Componente tarjeta individual o grupo apilado
function TarjetaIncidente({ inc, todosIncidentes, isSelected, onSelect, onCambiarEstado, onVerDetalle, onDesagrupar }) {
  const cfg = ESTADO_CONFIG[inc.estado] || ESTADO_CONFIG["Reportado"];
  const esGrupo = inc.esGrupo;
  const miembros = esGrupo ? inc.miembros : [];

  const [expanded, setExpanded] = useState(false);

  if (esGrupo) {
    return (
      <Box sx={{ position: "relative", mb: `${Math.min(miembros.length, 3) * 6}px` }}>
        {/* Tarjetas apiladas detrás */}
        {miembros.slice(1, 4).map((_, i) => (
          <Box key={i} sx={{
            position: "absolute", top: `${(i + 1) * 6}px`, left: `${(i + 1) * 4}px`,
            right: `-${(i + 1) * 4}px`,
            height: 80, bgcolor: "rgba(255,255,255,0.03)",
            border: `1px solid ${cfg.color}33`,
            borderLeft: `4px solid ${cfg.color}66`,
            borderRadius: 2, opacity: 0.6 - i * 0.15,
            zIndex: 3 - i,
          }} />
        ))}
        {/* Tarjeta principal del grupo */}
        <Card className={`glass-panel hover-card-premium hover-card-${inc.estado === "En proceso" ? "proceso" : inc.estado === "Resuelto" ? "resuelto" : "reportado"}`} elevation={0} sx={{
          borderRadius: 3,
          bgcolor: isSelected ? "rgba(11, 117, 14, 0.12)" : "transparent",
          outline: isSelected ? "2px solid #0B750E" : "none",
          position: "relative", zIndex: 4,
          border: "1px solid rgba(255,255,255,0.12)"
        }}>
          <CardContent sx={{ display: "flex", flexDirection: "column", py: "12px !important" }}>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center", width: "100%" }}>
              <Checkbox checked={isSelected} onChange={e => { e.stopPropagation(); onSelect(); }}
                sx={{ color: "#0B750E", "&.Mui-checked": { color: "#0B750E" } }} />
              <Box sx={{ width: 44, height: 44, borderRadius: 1, bgcolor: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Typography fontWeight="bold" sx={{ color: cfg.color, fontSize: 16 }}>{miembros.length}</Typography>
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.3, flexWrap: "wrap" }}>
                  <Typography fontWeight="bold" variant="body2" sx={{ color: "white" }}>Grupo: {inc.tipo}</Typography>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <span className={`led-indicator led-${inc.estado === "En proceso" ? "orange" : inc.estado === "Resuelto" ? "green" : "red"}`}></span>
                    <Chip label={inc.estado} size="small" sx={{ bgcolor: cfg.bg, color: cfg.color, fontSize: "0.65rem", fontWeight: "bold" }} />
                  </Box>
                  <Chip label={`${miembros.length} incidentes`} size="small" sx={{ bgcolor: "rgba(227,242,253,0.12)", color: "#b3e5fc", fontSize: "0.65rem", border: "1px solid rgba(179,229,252,0.2)" }} />
                </Box>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.55)" }}>
                  {miembros.map(m => m.ubicacionTexto).filter(Boolean).join(" · ")}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, minWidth: 120 }}>
                {ESTADOS.filter(e => e !== inc.estado).map(e => (
                  <Button key={e} size="small" variant="outlined" className="btn-interactive" onClick={() => onCambiarEstado(inc, e)}
                    sx={{ fontSize: "0.65rem", py: 0.3, borderColor: ESTADO_CONFIG[e].color, color: ESTADO_CONFIG[e].color, "&:hover": { bgcolor: ESTADO_CONFIG[e].bg } }}>
                    → {e}
                  </Button>
                ))}
                <Box sx={{ display: "flex", gap: 0.5, justifyContent: "space-between" }}>
                  <Button size="small" variant="text" onClick={() => setExpanded(!expanded)} sx={{ fontSize: "0.65rem", color: "#b9f6ca", fontWeight: "bold", minWidth: 0, px: 0.5 }}>
                    {expanded ? "Ocultar ▲" : "Ver Inc. ▼"}
                  </Button>
                  <Button size="small" variant="text" onClick={() => onVerDetalle(inc)} sx={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.7)", minWidth: 0, px: 0.5 }}>Ver det.</Button>
                </Box>
              </Box>
            </Box>

            <Collapse in={expanded} timeout="auto" unmountOnExit>
              <Box sx={{ mt: 2, borderTop: "1px solid rgba(255,255,255,0.1)", pt: 1.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: "bold", color: "rgba(255,255,255,0.6)", pl: 1 }}>
                  Incidentes en este grupo:
                </Typography>
                {miembros.map((m) => (
                  <Box key={m.id} sx={{
                    display: "flex", gap: 1.5, alignItems: "center", bgcolor: "rgba(255,255,255,0.03)", p: 1.2, borderRadius: 2, border: "1px solid rgba(255,255,255,0.08)",
                    ml: 1, mr: 1, "&:hover": { bgcolor: "rgba(255,255,255,0.07)" }
                  }}>
                    {m.imagenURL && (
                      <Box sx={{ width: 48, height: 48, borderRadius: 1, overflow: "hidden", flexShrink: 0, border: "1px solid rgba(255,255,255,0.15)" }}>
                        <img src={m.imagenURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </Box>
                    )}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="caption" sx={{ fontWeight: "bold", display: "block", color: "white" }}>{m.tipo}</Typography>
                      <Typography variant="caption" sx={{ display: "block", fontSize: "0.75rem", mb: 0.2, color: "rgba(255,255,255,0.8)" }} noWrap>{m.descripcion}</Typography>
                      <Typography variant="caption" sx={{ fontSize: "0.65rem", display: "block", color: "rgba(255,255,255,0.5)" }}>
                        👤 {m.usuarioNombre} · 📍 {m.ubicacionTexto} · 📅 {m.fechaCreacion?.toDate?.()?.toLocaleDateString("es-CO") || ""}
                      </Typography>
                    </Box>
                    <Button size="small" variant="outlined" startIcon={<CallSplit sx={{ fontSize: 12 }} />}
                      onClick={(e) => { e.stopPropagation(); onDesagrupar(m.id, m.grupoIncidenteId); }}
                      sx={{ fontSize: "0.6rem", py: 0.2, px: 1, borderColor: "#E47113", color: "#E47113", "&:hover": { bgcolor: "#fef3e2" } }}>
                      Sacar
                    </Button>
                  </Box>
                ))}
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Card className={`glass-panel hover-card-premium hover-card-${inc.estado === "En proceso" ? "proceso" : inc.estado === "Resuelto" ? "resuelto" : "reportado"}`} elevation={0} sx={{
      borderRadius: 3,
      bgcolor: isSelected ? "rgba(11, 117, 14, 0.12)" : "transparent",
      outline: isSelected ? "2px solid #0B750E" : "none",
      border: "1px solid rgba(255,255,255,0.12)"
    }}>
      <CardContent sx={{ display: "flex", gap: 2, alignItems: "center", py: "12px !important" }}>
        <Checkbox checked={isSelected} onChange={e => { e.stopPropagation(); onSelect(); }}
          sx={{ color: "#0B750E", "&.Mui-checked": { color: "#0B750E" } }} />
        {inc.imagenURL && (
          <Box sx={{ width: 60, height: 60, borderRadius: 1.5, overflow: "hidden", flexShrink: 0, border: "1px solid rgba(255,255,255,0.15)" }}>
            <img src={inc.imagenURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </Box>
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.3, flexWrap: "wrap" }}>
            <Typography fontWeight="bold" variant="body2" sx={{ color: "white" }}>{inc.tipo}</Typography>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <span className={`led-indicator led-${inc.estado === "En proceso" ? "orange" : inc.estado === "Resuelto" ? "green" : "red"}`}></span>
              <Chip label={inc.estado} size="small" sx={{ bgcolor: cfg.bg, color: cfg.color, fontSize: "0.65rem", fontWeight: "bold" }} />
            </Box>
          </Box>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.85)", display: "block" }} noWrap>{inc.descripcion}</Typography>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.55)" }}>
            👤 {inc.usuarioNombre} · 📍 {inc.ubicacionTexto} · {inc.fechaCreacion?.toDate?.()?.toLocaleDateString("es-CO") || ""}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, minWidth: 120 }}>
          {ESTADOS.filter(e => e !== inc.estado).map(e => (
            <Button key={e} size="small" variant="outlined" className="btn-interactive" onClick={() => onCambiarEstado(inc, e)}
              sx={{ fontSize: "0.65rem", py: 0.3, borderColor: ESTADO_CONFIG[e].color, color: ESTADO_CONFIG[e].color, "&:hover": { bgcolor: ESTADO_CONFIG[e].bg } }}>
              → {e}
            </Button>
          ))}
          <Button size="small" variant="text" onClick={() => onVerDetalle(inc)} sx={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.7)" }}>Ver detalle</Button>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function AdministradorVista() {
  const { usuario, cerrarSesion } = useAuth();
  const [incidentes, setIncidentes] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [seleccionados, setSeleccionados] = useState([]);
  const [incidenteDetalleId, setIncidenteDetalleId] = useState(null);
  const [esGrupoDetalle, setEsGrupoDetalle] = useState(false);
  const mapDetailRef = useRef(null);
  const [tab, setTab] = useState(0);
  const [filtroPeriodo, setFiltroPeriodo] = useState("todos");
  const [toastMsg, setToastMsg] = useState("");
  const [campanaAnchor, setCampanaAnchor] = useState(null);
  const notifTimer = useRef(null);

  useEffect(() => {
    const q = query(collection(db, "incidentes"));
    const unsub = onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => {
        const timeA = a.fechaCreacion?.toDate ? a.fechaCreacion.toDate().getTime() : (a.fechaCreacion ? new Date(a.fechaCreacion).getTime() : Date.now());
        const timeB = b.fechaCreacion?.toDate ? b.fechaCreacion.toDate().getTime() : (b.fechaCreacion ? new Date(b.fechaCreacion).getTime() : Date.now());
        return timeB - timeA;
      });
      setIncidentes(list);
    }, error => {
      console.error("Error al obtener incidentes para administrador:", error);
    });
    return unsub;
  }, []);

  // Notificación cada 30 min para incidentes Reportados
  useEffect(() => {
    notifTimer.current = setInterval(() => {
      const pendientes = incidentes.filter(i => i.estado === "Reportado").length;
      if (pendientes > 0) setToastMsg(`⚠️ Tienes ${pendientes} incidente(s) en estado "Reportado" sin revisar`);
    }, 30 * 60 * 1000);
    return () => clearInterval(notifTimer.current);
  }, [incidentes]);

  const incidentesPendientes = incidentes.filter(i => i.estado === "Reportado");

  // Construir lista agrupada para mostrar
  const incidentesFiltradosRaw = incidentes.filter(inc => {
    const matchEstado = filtroEstado === "Todos" || inc.estado === filtroEstado;
    const matchBusqueda = inc.tipo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      inc.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
      inc.ubicacionTexto?.toLowerCase().includes(busqueda.toLowerCase()) ||
      inc.usuarioNombre?.toLowerCase().includes(busqueda.toLowerCase());
    if (filtroPeriodo !== "todos") {
      const fecha = inc.fechaCreacion?.toDate?.();
      if (fecha) {
        const diffDias = (new Date() - fecha) / (1000 * 60 * 60 * 24);
        if (filtroPeriodo === "7dias" && diffDias > 7) return false;
        if (filtroPeriodo === "30dias" && diffDias > 30) return false;
      }
    }
    return matchEstado && matchBusqueda;
  });

  // Agrupar visualmente
  const itemsVista = (() => {
    const grupos = {};
    const individuales = [];
    incidentesFiltradosRaw.forEach(inc => {
      if (inc.grupoIncidenteId) {
        if (!grupos[inc.grupoIncidenteId]) grupos[inc.grupoIncidenteId] = [];
        grupos[inc.grupoIncidenteId].push(inc);
      } else {
        individuales.push(inc);
      }
    });
    const gruposVista = Object.entries(grupos).map(([grupoId, miembros]) => ({
      id: grupoId, esGrupo: true, miembros,
      tipo: miembros[0]?.tipo || "Incidente",
      estado: miembros[0]?.estado || "Reportado",
      grupoIncidenteId: grupoId,
    }));
    return [...gruposVista, ...individuales];
  })();

  const incidenteDetalle = (() => {
    if (!incidenteDetalleId) return null;
    if (esGrupoDetalle) {
      return itemsVista.find(i => i.id === incidenteDetalleId && i.esGrupo);
    } else {
      return incidentes.find(i => i.id === incidenteDetalleId);
    }
  })();

  useEffect(() => {
    if (!incidenteDetalle || incidenteDetalle.esGrupo || !incidenteDetalle.latitud || !incidenteDetalle.longitud) return;
    const timer = setTimeout(() => {
      if (!mapDetailRef.current) return;
      loadGoogleMaps("AIzaSyAch4GiG6bKokBQK-1h4x3N44So0AYfyRw")
        .then((google) => {
          const pos = { lat: incidenteDetalle.latitud, lng: incidenteDetalle.longitud };
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
            title: incidenteDetalle.tipo,
          });
        })
        .catch((err) => console.error("Error al cargar mapa de detalle:", err));
    }, 200);
    return () => clearTimeout(timer);
  }, [incidenteDetalleId, incidenteDetalle?.latitud, incidenteDetalle?.longitud]);

  // Detectar estado del botón agrupar/desagrupar
  const estadoBoton = (() => {
    if (seleccionados.length === 0) return "oculto";
    const items = itemsVista.filter(i => seleccionados.includes(i.id));
    const soloUnGrupo = items.length === 1 && items[0].esGrupo;
    if (soloUnGrupo) return "desagrupar";
    if (seleccionados.length >= 2) return "agrupar";
    return "oculto";
  })();

  async function cambiarEstado(incidente, nuevoEstado) {
    const historial = { estado: nuevoEstado, fecha: new Date().toISOString(), por: usuario.email };
    if (incidente.esGrupo) {
      const batch = writeBatch(db);
      incidente.miembros.forEach(m => batch.update(doc(db, "incidentes", m.id), { estado: nuevoEstado, historialEstados: arrayUnion(historial) }));
      await batch.commit();
    } else if (incidente.grupoIncidenteId) {
      const q = query(collection(db, "incidentes"), where("grupoIncidenteId", "==", incidente.grupoIncidenteId));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.update(d.ref, { estado: nuevoEstado, historialEstados: arrayUnion(historial) }));
      await batch.commit();
    } else {
      await updateDoc(doc(db, "incidentes", incidente.id), { estado: nuevoEstado, historialEstados: arrayUnion(historial) });
    }
    setToastMsg(`Estado actualizado a "${nuevoEstado}"`);
  }

  async function agruparSeleccionados() {
    const grupoId = `grupo_${Date.now()}`;
    const batch = writeBatch(db);
    // Obtener todos los IDs reales (incluyendo miembros de grupos)
    const idsReales = [];
    seleccionados.forEach(id => {
      const item = itemsVista.find(i => i.id === id);
      if (item?.esGrupo) item.miembros.forEach(m => idsReales.push(m.id));
      else idsReales.push(id);
    });
    idsReales.forEach(id => batch.update(doc(db, "incidentes", id), { grupoIncidenteId: grupoId }));
    await batch.commit();
    setSeleccionados([]);
    setToastMsg(`Incidentes agrupados exitosamente`);
  }

  async function desagruparGrupo() {
    const grupoItem = itemsVista.find(i => seleccionados.includes(i.id) && i.esGrupo);
    if (!grupoItem) return;
    const batch = writeBatch(db);
    // BUG FIX: Desagrupar todos los miembros reales en la base de datos, no sólo los filtrados en pantalla
    const todosMiembrosGrupo = incidentes.filter(m => m.grupoIncidenteId === grupoItem.grupoIncidenteId);
    todosMiembrosGrupo.forEach(m => batch.update(doc(db, "incidentes", m.id), { grupoIncidenteId: null }));
    await batch.commit();
    setSeleccionados([]);
    setToastMsg("Incidentes desagrupados");
  }

  async function desagruparMiembro(miembroId, grupoId) {
    const miembrosGrupo = incidentes.filter(i => i.grupoIncidenteId === grupoId);
    if (miembrosGrupo.length <= 2) {
      // Si quedan solo 2 y sacamos uno, disolver todo el grupo
      const batch = writeBatch(db);
      miembrosGrupo.forEach(m => batch.update(doc(db, "incidentes", m.id), { grupoIncidenteId: null }));
      await batch.commit();
      setToastMsg("Grupo disuelto");
      // Cerrar modal de detalles si estaba abierto para este grupo
      setIncidenteDetalleId(null);
      setEsGrupoDetalle(false);
    } else {
      await updateDoc(doc(db, "incidentes", miembroId), { grupoIncidenteId: null });
      setToastMsg("Incidente desagrupado");
    }
  }

  // Datos estadísticas
  const datosEstado = ESTADOS.map(e => ({ name: e, value: incidentesFiltradosRaw.filter(i => i.estado === e).length }));
  const datosTipo = Object.entries(
    incidentesFiltradosRaw.reduce((acc, i) => { acc[i.tipo] = (acc[i.tipo] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  return (
    <Box className="flow-gradient-bg" sx={{ minHeight: "100vh", pb: 5 }}>
      <AppBar className="slide-from-top" position="static" sx={{ bgcolor: "rgba(34, 34, 34, 0.15)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(255,255,255,0.08)", boxShadow: "none" }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: "bold", fontSize: { xs: "0.9rem", sm: "1.2rem" }, color: "white" }}>
            🛡️ Panel Administrador — UA Incidentes
          </Typography>
          {/* Campana notificaciones */}
          <IconButton color="inherit" onClick={e => setCampanaAnchor(e.currentTarget)} sx={{ color: "white" }}>
            <Badge badgeContent={incidentesPendientes.length} color="error">
              <NotificationsOutlined />
            </Badge>
          </IconButton>
          <Avatar sx={{ bgcolor: "#E81312", mr: 1, ml: 1, width: 36, height: 36, fontSize: 14 }}>
            {(usuario?.email || "A")[0].toUpperCase()}
          </Avatar>
          <IconButton color="inherit" onClick={cerrarSesion} sx={{ color: "white" }}><Logout /></IconButton>
        </Toolbar>
      </AppBar>

      {/* Popover campana */}
      <Popover
        open={Boolean(campanaAnchor)} anchorEl={campanaAnchor}
        onClose={() => setCampanaAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Box sx={{ width: 320, maxHeight: 400, overflow: "auto" }}>
          <Box sx={{ p: 2, bgcolor: "#0B750E", color: "white" }}>
            <Typography fontWeight="bold">🔔 Incidentes Pendientes ({incidentesPendientes.length})</Typography>
          </Box>
          {incidentesPendientes.length === 0 ? (
            <Box sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>
              <Typography variant="body2">No hay incidentes pendientes ✅</Typography>
            </Box>
          ) : (
            <List dense>
              {incidentesPendientes.slice(0, 10).map(inc => (
                <ListItem key={inc.id} divider>
                  <ListItemText
                    primary={inc.tipo}
                    secondary={`${inc.usuarioNombre} · ${inc.fechaCreacion?.toDate?.()?.toLocaleDateString("es-CO") || ""}`}
                  />
                </ListItem>
              ))}
              {incidentesPendientes.length > 10 && (
                <ListItem><ListItemText primary={`+${incidentesPendientes.length - 10} más...`} /></ListItem>
              )}
            </List>
          )}
        </Box>
      </Popover>

      <Box sx={{ maxWidth: 1100, mx: "auto", p: { xs: 2, md: 3 } }}>
        {/* Tarjetas resumen */}
        <Box className="slide-up-in stagger-1" sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2,1fr)", sm: "repeat(4,1fr)" }, gap: 2, mb: 3 }}>
          {[
            { label: "Total", value: incidentes.length, color: "#ffffff" },
            { label: "Reportados", value: incidentes.filter(i => i.estado === "Reportado").length, color: "#ff8a80" },
            { label: "En Proceso", value: incidentes.filter(i => i.estado === "En proceso").length, color: "#ffd180" },
            { label: "Resueltos", value: incidentes.filter(i => i.estado === "Resuelto").length, color: "#b9f6ca" },
          ].map(s => (
            <Card key={s.label} className="glass-panel btn-interactive" elevation={0} sx={{ borderRadius: 3, textAlign: "center", border: "1px solid rgba(255,255,255,0.12)" }}>
              <CardContent sx={{ py: "12px !important" }}>
                <Typography variant="h4" fontWeight="bold" sx={{ color: s.color }}>{s.value}</Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>{s.label}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, "& .MuiTab-root": { color: "rgba(255,255,255,0.7) !important" }, "& .Mui-selected": { color: "#b9f6ca !important" }, "& .MuiTabs-indicator": { bgcolor: "#b9f6ca" } }}>
          <Tab icon={<TableRows />} label="Incidentes" iconPosition="start" />
          <Tab icon={<BarChart />} label="Estadísticas" iconPosition="start" />
        </Tabs>

        {tab === 0 && (
          <>
            <Box className="slide-up-in stagger-2" sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
              <TextField placeholder="Buscar..." size="small" value={busqueda} onChange={e => setBusqueda(e.target.value)}
                InputProps={{ 
                  startAdornment: <Search sx={{ mr: 1, color: "rgba(255,255,255,0.6)" }} />,
                  style: { color: "white" }
                }}
                sx={{
                  flexGrow: 1, minWidth: 150,
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
                minWidth: 130,
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
                  {ESTADOS.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ 
                minWidth: 130,
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
                <InputLabel sx={{ color: "rgba(255,255,255,0.6)" }}>Período</InputLabel>
                <Select value={filtroPeriodo} onChange={e => setFiltroPeriodo(e.target.value)} label="Período">
                  <MenuItem value="todos">Todos</MenuItem>
                  <MenuItem value="7dias">Últimos 7 días</MenuItem>
                  <MenuItem value="30dias">Últimos 30 días</MenuItem>
                </Select>
              </FormControl>

              {/* Botón inteligente agrupar/desagrupar */}
              {estadoBoton === "agrupar" && (
                <Button variant="contained" startIcon={<MergeType />} className="btn-interactive" onClick={agruparSeleccionados}
                  sx={{ bgcolor: "#005A7E", "&:hover": { bgcolor: "#003d5c" }, borderRadius: 2 }} >
                  Agrupar ({seleccionados.length})
                </Button>
              )}
              {estadoBoton === "desagrupar" && (
                <Button variant="contained" startIcon={<CallSplit />} className="btn-interactive" onClick={desagruparGrupo}
                  sx={{ bgcolor: "#E47113", "&:hover": { bgcolor: "#c05e0e" }, borderRadius: 2 }} >
                  Desagrupar
                </Button>
              )}
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {itemsVista.map((inc, idx) => (
                <Box key={inc.id} className={`slide-up-in stagger-${(idx % 6) + 1}`}>
                  <TarjetaIncidente
                    inc={inc}
                    todosIncidentes={incidentes}
                    isSelected={seleccionados.includes(inc.id)}
                    onSelect={() => setSeleccionados(prev => prev.includes(inc.id) ? prev.filter(id => id !== inc.id) : [...prev, inc.id])}
                    onCambiarEstado={cambiarEstado}
                    onVerDetalle={(item) => { setIncidenteDetalleId(item.id); setEsGrupoDetalle(!!item.esGrupo); }}
                    onDesagrupar={desagruparMiembro}
                  />
                </Box>
              ))}
            </Box>
          </>
        )}

        {tab === 1 && (
          <Box className="estadisticas-print">
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }} className="no-print">
              <Typography variant="h6" fontWeight="bold">Estadísticas Generales</Typography>
              <Button variant="outlined" onClick={() => window.print()} sx={{ borderColor: "#0B750E", color: "#0B750E" }}>
                🖨️ Imprimir
              </Button>
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
              <Card elevation={1} sx={{ borderRadius: 2, p: 2 }}>
                <Typography fontWeight="bold" sx={{ mb: 2 }}>Por Estado</Typography>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={datosEstado} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => value > 0 ? `${name}: ${value}` : ""}>
                      {datosEstado.map((_, i) => <Cell key={i} fill={Object.values(ESTADO_CONFIG)[i]?.color || COLORES[i]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
              <Card elevation={1} sx={{ borderRadius: 2, p: 2 }}>
                <Typography fontWeight="bold" sx={{ mb: 2 }}>Por Tipo</Typography>
                <ResponsiveContainer width="100%" height={220}>
                  <ReBarChart data={datosTipo} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {datosTipo.map((_, i) => <Cell key={i} fill={COLORES[i % COLORES.length]} />)}
                    </Bar>
                  </ReBarChart>
                </ResponsiveContainer>
              </Card>
            </Box>
            <Card elevation={1} sx={{ borderRadius: 2, p: 2, mt: 3 }}>
              <Typography fontWeight="bold" sx={{ mb: 2 }}>Resumen</Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2 }}>
                {datosEstado.map(d => (
                  <Box key={d.name} sx={{ textAlign: "center", p: 2, borderRadius: 2, bgcolor: ESTADO_CONFIG[d.name]?.bg || "#f5f5f5" }}>
                    <Typography variant="h3" fontWeight="bold" sx={{ color: ESTADO_CONFIG[d.name]?.color }}>{d.value}</Typography>
                    <Typography variant="body2">{d.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {incidentes.length > 0 ? `${Math.round((d.value / incidentes.length) * 100)}%` : "0%"}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Card>
          </Box>
        )}
      </Box>

      {/* Toast notificación */}
      <Snackbar open={!!toastMsg} autoHideDuration={4000} onClose={() => setToastMsg("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert onClose={() => setToastMsg("")} severity="info" sx={{ width: "100%" }}>{toastMsg}</Alert>
      </Snackbar>

      {/* Modal detalle */}
      <Dialog open={!!incidenteDetalleId && !!incidenteDetalle} onClose={() => { setIncidenteDetalleId(null); setEsGrupoDetalle(false); }} PaperProps={{ className: "scale-in" }} maxWidth="sm" fullWidth>
        {incidenteDetalle && (() => {
          const esGrupo = incidenteDetalle.esGrupo;
          const cfg = ESTADO_CONFIG[incidenteDetalle.estado] || ESTADO_CONFIG["Reportado"];
          return (
            <>
              <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Box>
                  <Typography fontWeight="bold">{esGrupo ? `Grupo: ${incidenteDetalle.tipo}` : incidenteDetalle.tipo}</Typography>
                  <Chip label={incidenteDetalle.estado} size="small" sx={{ bgcolor: cfg.bg, color: cfg.color, mt: 0.5 }} />
                  {esGrupo && <Chip label={`${incidenteDetalle.miembros?.length} incidentes`} size="small" sx={{ ml: 1, bgcolor: "#e3f2fd", color: "#005A7E" }} />}
                </Box>
                <IconButton onClick={() => { setIncidenteDetalleId(null); setEsGrupoDetalle(false); }}><Close /></IconButton>
              </DialogTitle>
              <DialogContent>
                {esGrupo ? (
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>Incidentes en este grupo:</Typography>
                    {incidenteDetalle.miembros?.map(m => (
                      <Card key={m.id} variant="outlined" sx={{ mb: 1, borderRadius: 2 }}>
                        <CardContent sx={{ py: "8px !important", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">{m.tipo}</Typography>
                            <Typography variant="caption" color="text.secondary">{m.usuarioNombre} · {m.ubicacionTexto}</Typography>
                          </Box>
                          <Button size="small" variant="outlined" startIcon={<CallSplit />}
                            onClick={() => desagruparMiembro(m.id, m.grupoIncidenteId)}
                            sx={{ fontSize: "0.65rem", borderColor: "#E47113", color: "#E47113" }}>
                            Sacar
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <>
                    {incidenteDetalle.imagenURL && (
                      <Box sx={{ mb: 2, borderRadius: 2, overflow: "hidden" }}>
                        <img src={incidenteDetalle.imagenURL} alt="" style={{ width: "100%", maxHeight: 260, objectFit: "cover" }} />
                      </Box>
                    )}
                    <Typography sx={{ mb: 1 }}>{incidenteDetalle.descripcion}</Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2" color="text.secondary">👤 {incidenteDetalle.usuarioNombre}</Typography>
                    <Typography variant="body2" color="text.secondary">📍 {incidenteDetalle.ubicacionTexto}</Typography>
                    
                    {incidenteDetalle.latitud && incidenteDetalle.longitud && (
                      <Box sx={{ mt: 1.5, mb: 1.5 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: "bold" }}>
                          📍 Ubicación Georreferenciada:
                        </Typography>
                        <div ref={mapDetailRef} style={{ width: "100%", height: "200px", borderRadius: "8px", border: "1px solid #ccc" }} />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                          Coordenadas: {incidenteDetalle.latitud.toFixed(6)}, {incidenteDetalle.longitud.toFixed(6)}
                        </Typography>
                      </Box>
                    )}

                    <Typography variant="body2" color="text.secondary">📅 {incidenteDetalle.fechaCreacion?.toDate?.()?.toLocaleString("es-CO") || ""}</Typography>
                  </>
                )}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>Cambiar estado:</Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {ESTADOS.map(e => (
                      <Button key={e} size="small"
                        variant={incidenteDetalle.estado === e ? "contained" : "outlined"}
                        onClick={() => cambiarEstado(incidenteDetalle, e)}
                        sx={{
                          bgcolor: incidenteDetalle.estado === e ? ESTADO_CONFIG[e].color : "transparent",
                          borderColor: ESTADO_CONFIG[e].color,
                          color: incidenteDetalle.estado === e ? "white" : ESTADO_CONFIG[e].color,
                          "&:hover": { bgcolor: ESTADO_CONFIG[e].bg }
                        }}>
                        {e}
                      </Button>
                    ))}
                  </Box>
                </Box>
              </DialogContent>
            </>
          );
        })()}
      </Dialog>
    </Box>
  );
}
