import { useState, useEffect, useRef } from "react";
import {
  collection, query, onSnapshot,
  doc, updateDoc, arrayUnion, writeBatch, getDocs, where
} from "firebase/firestore";
import { db } from "../../FireBase/config";
import { useAuth } from "../../context/AuthContext";
import { loadGoogleMaps } from "../../utils/googleMaps";
import AnimatedCounter from "../../components/AnimatedCounter";
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
  NotificationsOutlined, CallSplit, Person, LocationOn,
  CalendarToday, Security, Print, CheckCircle
} from "@mui/icons-material";
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

const ESTADOS = ["Reportado", "En proceso", "Resuelto"];
const ESTADO_CONFIG = {
  "Reportado":  { color: "#ef4444", bg: "rgba(239, 68, 68, 0.12)" },
  "En proceso": { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.12)" },
  "Resuelto":   { color: "#10b981", bg: "rgba(16, 185, 129, 0.12)" },
};
const COLORES = ["#ef4444", "#f59e0b", "#10b981", "#0284c7", "#fbbf24", "#06b6d4", "#8b5cf6"];

// Componente tarjeta individual o grupo apilado
function TarjetaIncidente({ inc, todosIncidentes, isSelected, onSelect, onCambiarEstado, onVerDetalle, onDesagrupar }) {
  const cfg = ESTADO_CONFIG[inc.estado] || ESTADO_CONFIG["Reportado"];
  const esGrupo = inc.esGrupo;
  const miembros = esGrupo ? inc.miembros : [];

  const [expanded, setExpanded] = useState(false);

  // Manejador del efecto 3D Tilt
  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const rotateX = ((yc - y) / yc) * 4; 
    const rotateY = ((x - xc) / xc) * 4;

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

  if (esGrupo) {
    return (
      <Box sx={{ position: "relative", mb: `${Math.min(miembros.length, 3) * 6}px` }}>
        {/* Tarjetas apiladas detrás */}
        {miembros.slice(1, 4).map((_, i) => (
          <Box key={i} sx={{
            position: "absolute", top: `${(i + 1) * 6}px`, left: `${(i + 1) * 4}px`,
            right: `-${(i + 1) * 4}px`,
            height: 80, bgcolor: "rgba(18, 22, 33, 0.4)",
            border: `1px solid rgba(255, 255, 255, 0.05)`,
            borderLeft: `4px solid ${cfg.color}66`,
            borderRadius: 3, opacity: 0.6 - i * 0.15,
            zIndex: 3 - i,
          }} />
        ))}
        {/* Tarjeta principal del grupo */}
        <Card
          className={`glass-panel hover-card-premium hover-card-${inc.estado === "En proceso" ? "proceso" : inc.estado === "Resuelto" ? "resuelto" : "reportado"}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          elevation={0}
          sx={{
            borderRadius: 4,
            bgcolor: isSelected ? "rgba(16, 185, 129, 0.12) !important" : "rgba(18, 22, 33, 0.72)",
            outline: isSelected ? "2px solid #10b981" : "none",
            position: "relative", zIndex: 4,
            border: "1px solid rgba(255,255,255,0.05) !important",
            transition: "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)"
          }}
        >
          <CardContent sx={{ display: "flex", flexDirection: "column", p: "16px !important" }}>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center", width: "100%" }}>
              <Checkbox checked={isSelected} onChange={e => { e.stopPropagation(); onSelect(); }}
                sx={{ color: "rgba(255,255,255,0.3)", "&.Mui-checked": { color: "#10b981" } }} />
              <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: cfg.color + "1a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${cfg.color}33` }}>
                <Typography fontWeight="bold" sx={{ color: cfg.color, fontSize: 16 }}>{miembros.length}</Typography>
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5, flexWrap: "wrap" }}>
                  <Typography fontWeight="bold" variant="body2" sx={{ color: "white" }}>Grupo: {inc.tipo}</Typography>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <span className={`led-indicator led-${inc.estado === "En proceso" ? "orange" : inc.estado === "Resuelto" ? "green" : "red"}`}></span>
                    <Chip label={inc.estado} size="small" sx={{ bgcolor: cfg.bg, color: cfg.color, fontSize: "0.65rem", fontWeight: "bold" }} />
                  </Box>
                  <Chip label={`${miembros.length} incidentes`} size="small" sx={{ bgcolor: "rgba(16, 185, 129, 0.08)", color: "#34d399", fontSize: "0.65rem", border: "1px solid rgba(16, 185, 129, 0.15)" }} />
                </Box>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)" }}>
                  {miembros.map(m => m.ubicacionTexto).filter(Boolean).join(" · ")}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, minWidth: 120 }}>
                {ESTADOS.filter(e => e !== inc.estado).map(e => (
                  <Button key={e} size="small" variant="outlined" className="btn-interactive" onClick={() => onCambiarEstado(inc, e)}
                    sx={{ fontSize: "0.65rem", py: 0.5, borderColor: ESTADO_CONFIG[e].color, color: ESTADO_CONFIG[e].color, "&:hover": { bgcolor: ESTADO_CONFIG[e].bg } }}>
                    → {e}
                  </Button>
                ))}
                <Box sx={{ display: "flex", gap: 0.5, justifyContent: "space-between", mt: 0.5 }}>
                  <Button size="small" variant="text" onClick={() => setExpanded(!expanded)} sx={{ fontSize: "0.65rem", color: "#34d399", fontWeight: "bold", minWidth: 0, px: 0.5 }}>
                    {expanded ? "Ocultar ▲" : "Ver Inc. ▼"}
                  </Button>
                  <Button size="small" variant="text" onClick={() => onVerDetalle(inc)} sx={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.5)", minWidth: 0, px: 0.5 }}>Ver det.</Button>
                </Box>
              </Box>
            </Box>

            <Collapse in={expanded} timeout="auto" unmountOnExit>
              <Box sx={{ mt: 2, borderTop: "1px solid rgba(255,255,255,0.06)", pt: 1.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: "bold", color: "rgba(255,255,255,0.4)", pl: 1 }}>
                  Incidentes en este grupo:
                </Typography>
                {miembros.map((m) => (
                  <Box key={m.id} sx={{
                    display: "flex", gap: 2, alignItems: "center", bgcolor: "rgba(255,255,255,0.01)", p: 1.2, borderRadius: 3, border: "1px solid rgba(255,255,255,0.04)",
                    ml: 1, mr: 1, "&:hover": { bgcolor: "rgba(255,255,255,0.03)" }
                  }}>
                    {m.imagenURL && (
                      <Box sx={{ width: 48, height: 48, borderRadius: 2, overflow: "hidden", flexShrink: 0, border: "1px solid rgba(255,255,255,0.08)" }}>
                        <img src={m.imagenURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </Box>
                    )}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="caption" sx={{ fontWeight: "bold", display: "block", color: "white" }}>{m.tipo}</Typography>
                      <Typography variant="caption" sx={{ display: "block", fontSize: "0.75rem", mb: 0.5, color: "rgba(255,255,255,0.5)" }} noWrap>{m.descripcion}</Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, flexWrap: "wrap", fontSize: "0.68rem", color: "rgba(255,255,255,0.35)" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}><Person sx={{ fontSize: 11, color: "#10b981" }} />{m.usuarioNombre}</Box>
                        <span>·</span>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}><LocationOn sx={{ fontSize: 11, color: "#10b981" }} />{m.ubicacionTexto}</Box>
                        <span>·</span>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}><CalendarToday sx={{ fontSize: 11 }} />{m.fechaCreacion?.toDate?.()?.toLocaleDateString("es-CO") || "Reciente"}</Box>
                      </Box>
                    </Box>
                    <Button size="small" variant="outlined" startIcon={<CallSplit sx={{ fontSize: 12 }} />}
                      onClick={(e) => { e.stopPropagation(); onDesagrupar(m.id, m.grupoIncidenteId); }}
                      sx={{ fontSize: "0.6rem", py: 0.3, px: 1, borderColor: "#f59e0b", color: "#f59e0b", "&:hover": { bgcolor: "rgba(245,158,11,0.08)" } }}>
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
    <Card
      className={`glass-panel hover-card-premium hover-card-${inc.estado === "En proceso" ? "proceso" : inc.estado === "Resuelto" ? "resuelto" : "reportado"}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      elevation={0}
      sx={{
        borderRadius: 4,
        bgcolor: isSelected ? "rgba(16, 185, 129, 0.12) !important" : "rgba(18, 22, 33, 0.72)",
        outline: isSelected ? "2px solid #10b981" : "none",
        border: "1px solid rgba(255,255,255,0.05) !important",
        transition: "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)"
      }}
    >
      <CardContent sx={{ display: "flex", gap: 3, alignItems: "center", p: "16px !important" }}>
        <Checkbox checked={isSelected} onChange={e => { e.stopPropagation(); onSelect(); }}
          sx={{ color: "rgba(255,255,255,0.3)", "&.Mui-checked": { color: "#10b981" } }} />
        {inc.imagenURL && (
          <Box sx={{ width: 65, height: 65, borderRadius: 2.5, overflow: "hidden", flexShrink: 0, border: "1px solid rgba(255,255,255,0.08)" }}>
            <img src={inc.imagenURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </Box>
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5, flexWrap: "wrap" }}>
            <Typography fontWeight="bold" variant="body2" sx={{ color: "white" }}>{inc.tipo}</Typography>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <span className={`led-indicator led-${inc.estado === "En proceso" ? "orange" : inc.estado === "Resuelto" ? "green" : "red"}`}></span>
              <Chip label={inc.estado} size="small" sx={{ bgcolor: cfg.bg, color: cfg.color, fontSize: "0.65rem", fontWeight: "bold" }} />
            </Box>
          </Box>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", display: "block", mb: 0.5 }} noWrap>{inc.descripcion}</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, flexWrap: "wrap", fontSize: "0.72rem", color: "rgba(255,255,255,0.35)" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}><Person sx={{ fontSize: 12, color: "#10b981" }} />{inc.usuarioNombre}</Box>
            <span>·</span>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}><LocationOn sx={{ fontSize: 12, color: "#10b981" }} />{inc.ubicacionTexto}</Box>
            <span>·</span>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}><CalendarToday sx={{ fontSize: 11 }} />{inc.fechaCreacion?.toDate?.()?.toLocaleDateString("es-CO") || "Reciente"}</Box>
          </Box>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, minWidth: 120 }}>
          {ESTADOS.filter(e => e !== inc.estado).map(e => (
            <Button key={e} size="small" variant="outlined" className="btn-interactive" onClick={() => onCambiarEstado(inc, e)}
              sx={{ fontSize: "0.65rem", py: 0.5, borderColor: ESTADO_CONFIG[e].color, color: ESTADO_CONFIG[e].color, "&:hover": { bgcolor: ESTADO_CONFIG[e].bg } }}>
              → {e}
            </Button>
          ))}
          <Button size="small" variant="text" onClick={() => onVerDetalle(inc)} sx={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.5)", mt: 0.3 }}>Ver detalle</Button>
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
      if (pendientes > 0) setToastMsg(`Tienes ${pendientes} incidente(s) en estado "Reportado" sin revisar`);
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
            styles: [
              { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
              { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
              { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
              { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#4b6878" }] },
              { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] }
            ]
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

  // Manejador de 3D Tilt genérico para tarjetas superiores
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
    <Box sx={{ bgcolor: "#08090d", minHeight: "100vh", pb: 5, position: "relative", overflow: "hidden" }}>
      {/* Luces flotantes de fondo */}
      <div className="ambient-glow-1" />
      <div className="ambient-glow-2" />
      <div className="ambient-glow-3" />

      {/* AppBar */}
      <AppBar className="slide-from-top" position="static" sx={{ bgcolor: "rgba(10, 11, 16, 0.4)", backdropFilter: "blur(18px)", borderBottom: "1px solid rgba(255,255,255,0.08)", boxShadow: "none" }}>
        <Toolbar sx={{ maxWidth: 1200, width: "100%", mx: "auto" }}>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 900, fontSize: { xs: "0.9rem", sm: "1.15rem" }, color: "white", display: "flex", alignItems: "center", gap: 1, letterSpacing: "-0.03em" }}>
            <Security sx={{ color: "#10b981" }} /> Panel Administrador — UA
          </Typography>
          
          {/* Campana notificaciones */}
          <IconButton color="inherit" onClick={e => setCampanaAnchor(e.currentTarget)} sx={{ mr: 1, color: "rgba(255,255,255,0.7)", "&:hover": { color: "white" } }}>
            <Badge badgeContent={incidentesPendientes.length} color="error">
              <NotificationsOutlined />
            </Badge>
          </IconButton>
          
          <Avatar sx={{ bgcolor: "#ef4444", mr: 1, width: 36, height: 36, fontSize: 14, fontWeight: "bold", border: "1px solid rgba(255,255,255,0.12)" }}>
            {(usuario?.email || "A")[0].toUpperCase()}
          </Avatar>
          <IconButton color="inherit" onClick={cerrarSesion} sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "#ef4444" } }}><Logout /></IconButton>
        </Toolbar>
      </AppBar>

      {/* Popover campana */}
      <Popover
        open={Boolean(campanaAnchor)} anchorEl={campanaAnchor}
        onClose={() => setCampanaAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            bgcolor: "rgba(18, 22, 33, 0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            borderRadius: 4, width: 330
          }
        }}
      >
        <Box sx={{ maxHeight: 400, overflow: "auto" }}>
          <Box sx={{ p: 2, bgcolor: "rgba(16, 185, 129, 0.08)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <Typography fontWeight="800" sx={{ display: "flex", alignItems: "center", gap: 1, color: "white", fontSize: "0.9rem" }}><NotificationsOutlined sx={{ fontSize: 18, color: "#10b981" }} /> Incidentes Pendientes ({incidentesPendientes.length})</Typography>
          </Box>
          {incidentesPendientes.length === 0 ? (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <CheckCircle sx={{ fontSize: 32, color: "#10b981", opacity: 0.8, mb: 1 }} />
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)" }}>¡Excelente! No hay pendientes.</Typography>
            </Box>
          ) : (
            <List dense sx={{ py: 0 }}>
              {incidentesPendientes.slice(0, 10).map((inc, i) => (
                <ListItem key={inc.id} divider={i < incidentesPendientes.length - 1} sx={{ borderColor: "rgba(255,255,255,0.05)", py: 1.5 }}>
                  <ListItemText
                    primary={<Typography variant="body2" fontWeight="bold" color="white" noWrap>{inc.tipo}</Typography>}
                    secondary={<Typography variant="caption" color="rgba(255,255,255,0.45)">{inc.usuarioNombre} · {inc.fechaCreacion?.toDate?.()?.toLocaleDateString("es-CO") || "Reciente"}</Typography>}
                  />
                </ListItem>
              ))}
              {incidentesPendientes.length > 10 && (
                <ListItem sx={{ py: 1, textAlign: "center" }}><ListItemText primary={<Typography variant="caption" color="#10b981" fontWeight="bold">+{incidentesPendientes.length - 10} más por revisar</Typography>} /></ListItem>
              )}
            </List>
          )}
        </Box>
      </Popover>

      <Box sx={{ maxWidth: 1150, mx: "auto", p: { xs: 2, sm: 3 }, position: "relative", zIndex: 1 }}>
        
        {/* Resumen Superior */}
        <Box className="slide-up-in stagger-1" sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" }, gap: 2, mb: 4, mt: 2 }}>
          {[
            { label: "Total Reportes", value: incidentes.length, color: "#ffffff", border: "rgba(255,255,255,0.15)" },
            { label: "Reportados", value: incidentes.filter(i => i.estado === "Reportado").length, color: "#ef4444", border: "rgba(239, 68, 68, 0.3)" },
            { label: "En Proceso", value: incidentes.filter(i => i.estado === "En proceso").length, color: "#f59e0b", border: "rgba(245, 158, 11, 0.3)" },
            { label: "Resueltos", value: incidentes.filter(i => i.estado === "Resuelto").length, color: "#10b981", border: "rgba(16, 185, 129, 0.3)" },
          ].map(s => (
            <Card
              key={s.label}
              className="glass-panel hover-card-premium"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              elevation={0}
              sx={{
                borderRadius: 4, textAlign: "center", py: 1.5,
                border: "1px solid rgba(255,255,255,0.06) !important",
                borderTop: `2px solid ${s.border} !important`
              }}
            >
              <CardContent sx={{ py: "8px !important" }}>
                <Typography variant="h3" fontWeight="900" sx={{ color: s.color, letterSpacing: "-0.03em" }}>
                  <AnimatedCounter value={s.value} />
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>{s.label}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Pestañas de control */}
        <Tabs
          value={tab} onChange={(_, v) => setTab(v)}
          sx={{
            mb: 3.5,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            "& .MuiTab-root": { color: "rgba(255,255,255,0.5) !important", fontWeight: "bold", fontSize: "0.95rem" },
            "& .Mui-selected": { color: "#10b981 !important" },
            "& .MuiTabs-indicator": { bgcolor: "#10b981", height: 3, borderRadius: "3px 3px 0 0" }
          }}
        >
          <Tab icon={<TableRows />} label="Incidentes" iconPosition="start" />
          <Tab icon={<BarChart />} label="Estadísticas" iconPosition="start" />
        </Tabs>

        {tab === 0 && (
          <>
            {/* Controles de filtrado y agrupamiento */}
            <Box className="slide-up-in stagger-2" sx={{ display: "flex", gap: 2, mb: 3.5, flexWrap: "wrap", alignItems: "center" }}>
              <TextField
                placeholder="Buscar por usuario, tipo, descripción..."
                size="small"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                InputProps={{ 
                  startAdornment: <Search sx={{ mr: 1, color: "rgba(255,255,255,0.4)" }} />,
                  style: { color: "white" }
                }}
                sx={{
                  flexGrow: 1, minWidth: 200,
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "rgba(255,255,255,0.03)",
                    "& fieldset": { borderColor: "rgba(255,255,255,0.08)" },
                    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                    "&.Mui-focused fieldset": { borderColor: "#10b981" },
                    "& input": { color: "white" },
                    "& input::placeholder": { color: "rgba(255,255,255,0.4)", opacity: 1 },
                  }
                }}
              />
              <FormControl size="small" sx={{ 
                minWidth: 140,
                "& .MuiOutlinedInput-root": {
                  bgcolor: "rgba(255,255,255,0.03)",
                  color: "white",
                  "& fieldset": { borderColor: "rgba(255,255,255,0.08)" },
                  "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                  "&.Mui-focused fieldset": { borderColor: "#10b981" },
                },
                "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.4)" },
                "& .MuiSelect-icon": { color: "white" }
              }}>
                <InputLabel>Estado</InputLabel>
                <Select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} label="Estado">
                  <MenuItem value="Todos">Todos</MenuItem>
                  {ESTADOS.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ 
                minWidth: 140,
                "& .MuiOutlinedInput-root": {
                  bgcolor: "rgba(255,255,255,0.03)",
                  color: "white",
                  "& fieldset": { borderColor: "rgba(255,255,255,0.08)" },
                  "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                  "&.Mui-focused fieldset": { borderColor: "#10b981" },
                },
                "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.4)" },
                "& .MuiSelect-icon": { color: "white" }
              }}>
                <InputLabel>Período</InputLabel>
                <Select value={filtroPeriodo} onChange={e => setFiltroPeriodo(e.target.value)} label="Período">
                  <MenuItem value="todos">Todos</MenuItem>
                  <MenuItem value="7dias">Últimos 7 días</MenuItem>
                  <MenuItem value="30dias">Últimos 30 días</MenuItem>
                </Select>
              </FormControl>

              {/* Botón inteligente agrupar/desagrupar */}
              {estadoBoton === "agrupar" && (
                <Button variant="contained" startIcon={<MergeType />} className="btn-interactive" onClick={agruparSeleccionados}
                  sx={{ bgcolor: "#0284c7", "&:hover": { bgcolor: "#0369a1" }, borderRadius: 3, fontWeight: "bold", boxShadow: "0 6px 15px rgba(2, 132, 199, 0.35)" }} >
                  Agrupar ({seleccionados.length})
                </Button>
              )}
              {estadoBoton === "desagrupar" && (
                <Button variant="contained" startIcon={<CallSplit />} className="btn-interactive" onClick={desagruparGrupo}
                  sx={{ bgcolor: "#f59e0b", "&:hover": { bgcolor: "#d97706" }, borderRadius: 3, fontWeight: "bold", boxShadow: "0 6px 15px rgba(245, 158, 11, 0.35)" }} >
                  Desagrupar
                </Button>
              )}
            </Box>

            {/* Listado de incidentes y grupos */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.2 }}>
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
          <Box className="estadisticas-print slide-up-in">
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }} className="no-print">
              <Typography variant="h6" fontWeight="bold" sx={{ color: "white" }}>Métricas y Analíticas Generales</Typography>
              <Button variant="outlined" startIcon={<Print />} onClick={() => window.print()} sx={{ borderColor: "rgba(255,255,255,0.15)", color: "white", "&:hover": { borderColor: "#10b981", bgcolor: "rgba(16, 185, 129, 0.08)" }, borderRadius: 3 }}>
                Imprimir Reporte
              </Button>
            </Box>
            
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 4 }}>
              {/* Gráfico circular por Estado */}
              <Card className="glass-panel" elevation={0} sx={{ borderRadius: 4, p: 3, border: "1px solid rgba(255,255,255,0.05) !important" }}>
                <Typography fontWeight="bold" sx={{ mb: 3, color: "white" }}>Estructura por Estado</Typography>
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <defs>
                      <linearGradient id="pieReportado" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#f87171" />
                        <stop offset="100%" stopColor="#ef4444" />
                      </linearGradient>
                      <linearGradient id="pieProceso" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </linearGradient>
                      <linearGradient id="pieResuelto" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                    <Pie data={datosEstado} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ name, value }) => value > 0 ? `${name}: ${value}` : ""}>
                      <Cell fill="url(#pieReportado)" />
                      <Cell fill="url(#pieProceso)" />
                      <Cell fill="url(#pieResuelto)" />
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "rgba(18, 22, 33, 0.85)", borderColor: "rgba(255,255,255,0.08)", borderRadius: "10px", color: "white", backdropFilter: "blur(10px)" }} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              {/* Gráfico de barras por Tipo */}
              <Card className="glass-panel" elevation={0} sx={{ borderRadius: 4, p: 3, border: "1px solid rgba(255,255,255,0.05) !important" }}>
                <Typography fontWeight="bold" sx={{ mb: 3, color: "white" }}>Frecuencia por Tipo</Typography>
                <ResponsiveContainer width="100%" height={230}>
                  <ReBarChart data={datosTipo} layout="vertical" margin={{ left: 10 }}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.95} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis type="number" allowDecimals={false} stroke="rgba(255,255,255,0.3)" />
                    <YAxis type="category" dataKey="name" width={115} tick={{ fontSize: 9, fill: "rgba(255,255,255,0.6)" }} stroke="rgba(255,255,255,0.3)" />
                    <Tooltip contentStyle={{ backgroundColor: "rgba(18, 22, 33, 0.85)", borderColor: "rgba(255,255,255,0.08)", borderRadius: "10px", color: "white", backdropFilter: "blur(10px)" }} />
                    <Bar dataKey="value" fill="url(#barGradient)" radius={[0, 4, 4, 0]} />
                  </ReBarChart>
                </ResponsiveContainer>
              </Card>
            </Box>

            {/* Resumen detallado de porcentajes */}
            <Card className="glass-panel" elevation={0} sx={{ borderRadius: 4, p: 3, mt: 4, border: "1px solid rgba(255,255,255,0.05) !important" }}>
              <Typography fontWeight="bold" sx={{ mb: 3, color: "white" }}>Porcentajes de Efectividad</Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2.5 }}>
                {datosEstado.map(d => (
                  <Box key={d.name} sx={{ textAlign: "center", p: 2.5, borderRadius: 3, bgcolor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <Typography variant="h3" fontWeight="900" sx={{ color: ESTADO_CONFIG[d.name]?.color, letterSpacing: "-0.03em" }}>{d.value}</Typography>
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)", fontWeight: "500" }}>{d.name}</Typography>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.3)", display: "block", mt: 0.5 }}>
                      {incidentes.length > 0 ? `${Math.round((d.value / incidentes.length) * 100)}%` : "0%"} del total
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
        <Alert onClose={() => setToastMsg("")} severity="info" sx={{ width: "100%", bgcolor: "rgba(18, 22, 33, 0.9)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "white", backdropFilter: "blur(15px)" }}>{toastMsg}</Alert>
      </Snackbar>

      {/* Modal detalle */}
      <Dialog open={!!incidenteDetalleId && !!incidenteDetalle} onClose={() => { setIncidenteDetalleId(null); setEsGrupoDetalle(false); }} PaperProps={{ className: "scale-in" }} maxWidth="sm" fullWidth>
        {incidenteDetalle && (() => {
          const esGrupo = incidenteDetalle.esGrupo;
          const cfg = ESTADO_CONFIG[incidenteDetalle.estado] || ESTADO_CONFIG["Reportado"];
          return (
            <>
              <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid rgba(255,255,255,0.08)", py: 2 }}>
                <Box>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: "white" }}>{esGrupo ? `Grupo: ${incidenteDetalle.tipo}` : incidenteDetalle.tipo}</Typography>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 0.5 }}>
                    <span className={`led-indicator led-${incidenteDetalle.estado === "En proceso" ? "orange" : incidenteDetalle.estado === "Resuelto" ? "green" : "red"}`}></span>
                    <Chip label={incidenteDetalle.estado} size="small" sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: "bold" }} />
                    {esGrupo && <Chip label={`${incidenteDetalle.miembros?.length} incidentes`} size="small" sx={{ bgcolor: "rgba(16, 185, 129, 0.08)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.15)" }} />}
                  </Box>
                </Box>
                <IconButton onClick={() => { setIncidenteDetalleId(null); setEsGrupoDetalle(false); }} sx={{ color: "rgba(255,255,255,0.5)", "&:hover": { color: "white" } }}><Close /></IconButton>
              </DialogTitle>
              <DialogContent sx={{ pt: 3 }}>
                {esGrupo ? (
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5, color: "white" }}>Incidentes en este grupo:</Typography>
                    {incidenteDetalle.miembros?.map(m => (
                      <Card key={m.id} variant="outlined" sx={{ mb: 1.5, borderRadius: 3, bgcolor: "rgba(255,255,255,0.01)", borderColor: "rgba(255,255,255,0.06)" }}>
                        <CardContent sx={{ py: "12px !important", px: "16px !important", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Box>
                            <Typography variant="body2" fontWeight="bold" color="white">{m.tipo}</Typography>
                            <Typography variant="caption" color="rgba(255,255,255,0.4)">{m.usuarioNombre} · {m.ubicacionTexto}</Typography>
                          </Box>
                          <Button size="small" variant="outlined" startIcon={<CallSplit />}
                            onClick={() => desagruparMiembro(m.id, m.grupoIncidenteId)}
                            sx={{ fontSize: "0.65rem", borderColor: "#f59e0b", color: "#f59e0b", "&:hover": { bgcolor: "rgba(245, 158, 11, 0.08)" } }}>
                            Sacar
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <>
                    {incidenteDetalle.imagenURL && (
                      <Box sx={{ mb: 2.5, borderRadius: 4, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <img src={incidenteDetalle.imagenURL} alt="" style={{ width: "100%", maxHeight: 260, objectFit: "cover" }} />
                      </Box>
                    )}
                    <Typography sx={{ color: "white", mb: 2, lineHeight: 1.6 }}>{incidenteDetalle.descripcion}</Typography>
                    <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.08)" }} />
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 3 }}>
                      <Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 1, color: "rgba(255,255,255,0.6)" }}><Person sx={{ fontSize: 16, color: "#10b981" }} /> {incidenteDetalle.usuarioNombre}</Typography>
                      <Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 1, color: "rgba(255,255,255,0.6)" }}><LocationOn sx={{ fontSize: 16, color: "#10b981" }} /> {incidenteDetalle.ubicacionTexto}</Typography>

                      {incidenteDetalle.latitud && incidenteDetalle.longitud && (
                        <Box sx={{ mt: 1.5 }}>
                          <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold", color: "white" }}>
                            Ubicación Georreferenciada:
                          </Typography>
                          <div ref={mapDetailRef} style={{ width: "100%", height: "200px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.12)" }} />
                          <Typography variant="caption" sx={{ mt: 0.5, display: "block", color: "rgba(255,255,255,0.4)" }}>
                            Coordenadas: {incidenteDetalle.latitud.toFixed(6)}, {incidenteDetalle.longitud.toFixed(6)}
                          </Typography>
                        </Box>
                      )}

                      <Typography variant="caption" sx={{ display: "flex", alignItems: "center", gap: 1, color: "rgba(255,255,255,0.45)", mt: 1 }}><CalendarToday sx={{ fontSize: 14 }} /> {incidenteDetalle.fechaCreacion?.toDate?.()?.toLocaleString("es-CO") || "Reciente"}</Typography>
                    </Box>
                  </>
                )}
                
                <Box sx={{ mt: 3, p: 2.5, bgcolor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 3 }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ color: "white", mb: 1.5 }}>Cambiar estado:</Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {ESTADOS.map(e => (
                      <Button key={e} size="small"
                        variant={incidenteDetalle.estado === e ? "contained" : "outlined"}
                        onClick={() => cambiarEstado(incidenteDetalle, e)}
                        sx={{
                          bgcolor: incidenteDetalle.estado === e ? ESTADO_CONFIG[e].color : "transparent",
                          borderColor: ESTADO_CONFIG[e].color,
                          color: incidenteDetalle.estado === e ? "white" : ESTADO_CONFIG[e].color,
                          "&:hover": { bgcolor: ESTADO_CONFIG[e].bg, color: incidenteDetalle.estado === e ? "white" : ESTADO_CONFIG[e].color }
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
