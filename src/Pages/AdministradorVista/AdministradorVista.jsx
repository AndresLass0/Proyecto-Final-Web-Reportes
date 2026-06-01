import { useState, useEffect } from "react";
import {
  collection, query, onSnapshot, orderBy,
  doc, updateDoc, arrayUnion, writeBatch, getDocs, where
} from "firebase/firestore";
import { db } from "../../FireBase/config";
import { useAuth } from "../../context/AuthContext";
import {
  Box, Typography, Button, Chip, Card, CardContent,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Dialog, DialogContent, DialogTitle, IconButton, AppBar,
  Toolbar, Avatar, Divider, Alert, Checkbox, Tabs, Tab
} from "@mui/material";
import {
  Close, Search, Logout, CheckCircle, Schedule,
  ReportProblem, MergeType, BarChart, TableRows
} from "@mui/icons-material";
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

const ESTADOS = ["Reportado", "En proceso", "Resuelto"];
const ESTADO_CONFIG = {
  "Reportado":  { color: "#E81312", bg: "#fde8e8" },
  "En proceso": { color: "#E47113", bg: "#fef3e2" },
  "Resuelto":   { color: "#0B750E", bg: "#e8f5e9" },
};
const COLORES_GRAFICO = ["#E81312", "#E47113", "#0B750E", "#005A7E", "#EDB02E", "#169586", "#704595"];

export default function AdministradorVista() {
  const { usuario, cerrarSesion } = useAuth();
  const [incidentes, setIncidentes] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [seleccionados, setSeleccionados] = useState([]);
  const [incidenteDetalle, setIncidenteDetalle] = useState(null);
  const [tab, setTab] = useState(0);
  const [exito, setExito] = useState("");
  const [filtroPeriodo, setFiltroPeriodo] = useState("todos");

  useEffect(() => {
    const q = query(collection(db, "incidentes"), orderBy("fechaCreacion", "desc"));
    const unsub = onSnapshot(q, snap => {
      setIncidentes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  // Cambiar estado de un incidente (y todos los agrupados)
  async function cambiarEstado(incidente, nuevoEstado) {
    const historial = {
      estado: nuevoEstado,
      fecha: new Date().toISOString(),
      por: usuario.email
    };
    // Si tiene grupo, actualizar todos los del grupo
    if (incidente.grupoIncidenteId) {
      const q = query(collection(db, "incidentes"), where("grupoIncidenteId", "==", incidente.grupoIncidenteId));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach(d => {
        batch.update(d.ref, { estado: nuevoEstado, historialEstados: arrayUnion(historial) });
      });
      await batch.commit();
    } else {
      await updateDoc(doc(db, "incidentes", incidente.id), {
        estado: nuevoEstado,
        historialEstados: arrayUnion(historial)
      });
    }
    setExito(`Estado actualizado a "${nuevoEstado}"`);
    setTimeout(() => setExito(""), 3000);
    setIncidenteDetalle(prev => prev ? { ...prev, estado: nuevoEstado } : null);
  }

  // Agrupar incidentes seleccionados
  async function agruparIncidentes() {
    if (seleccionados.length < 2) return;
    const grupoId = `grupo_${Date.now()}`;
    const batch = writeBatch(db);
    seleccionados.forEach(id => {
      batch.update(doc(db, "incidentes", id), { grupoIncidenteId: grupoId });
    });
    await batch.commit();
    setSeleccionados([]);
    setExito(`${seleccionados.length} incidentes agrupados exitosamente`);
    setTimeout(() => setExito(""), 3000);
  }

  const incidentesFiltrados = incidentes.filter(inc => {
    const matchEstado = filtroEstado === "Todos" || inc.estado === filtroEstado;
    const matchBusqueda = inc.tipo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      inc.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
      inc.ubicacionTexto?.toLowerCase().includes(busqueda.toLowerCase()) ||
      inc.usuarioNombre?.toLowerCase().includes(busqueda.toLowerCase());

    if (filtroPeriodo === "todos") return matchEstado && matchBusqueda;
    const fecha = inc.fechaCreacion?.toDate?.();
    if (!fecha) return matchEstado && matchBusqueda;
    const ahora = new Date();
    const diffDias = (ahora - fecha) / (1000 * 60 * 60 * 24);
    if (filtroPeriodo === "7dias" && diffDias > 7) return false;
    if (filtroPeriodo === "30dias" && diffDias > 30) return false;
    return matchEstado && matchBusqueda;
  });

  // Datos para gráficos
  const datosEstado = ESTADOS.map(e => ({ name: e, value: incidentesFiltrados.filter(i => i.estado === e).length }));
  const datosTipo = Object.entries(
    incidentesFiltrados.reduce((acc, i) => { acc[i.tipo] = (acc[i.tipo] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  function imprimirEstadisticas() {
    window.print();
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      <AppBar position="static" sx={{ bgcolor: "#222222" }}>
        <Toolbar>
          <Typography variant="h6" fontFamily="serif" sx={{ flexGrow: 1, fontWeight: "bold" }}>
            🛡️ Panel Administrador — UA Incidentes
          </Typography>
          <Avatar sx={{ bgcolor: "#E81312", mr: 1, width: 36, height: 36, fontSize: 14 }}>
            {(usuario?.email || "A")[0].toUpperCase()}
          </Avatar>
          <IconButton color="inherit" onClick={cerrarSesion}><Logout /></IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 1100, mx: "auto", p: 3 }}>
        {exito && <Alert severity="success" sx={{ mb: 2 }}>{exito}</Alert>}

        {/* Tarjetas resumen */}
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 3 }}>
          {[
            { label: "Total", value: incidentes.length, color: "#222" },
            { label: "Reportados", value: incidentes.filter(i => i.estado === "Reportado").length, color: "#E81312" },
            { label: "En Proceso", value: incidentes.filter(i => i.estado === "En proceso").length, color: "#E47113" },
            { label: "Resueltos", value: incidentes.filter(i => i.estado === "Resuelto").length, color: "#0B750E" },
          ].map(s => (
            <Card key={s.label} elevation={1} sx={{ borderRadius: 2, textAlign: "center" }}>
              <CardContent sx={{ py: "12px !important" }}>
                <Typography variant="h4" fontWeight="bold" sx={{ color: s.color }}>{s.value}</Typography>
                <Typography variant="caption" color="text.secondary">{s.label}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, "& .Mui-selected": { color: "#0B750E !important" }, "& .MuiTabs-indicator": { bgcolor: "#0B750E" } }}>
          <Tab icon={<TableRows />} label="Incidentes" iconPosition="start" />
          <Tab icon={<BarChart />} label="Estadísticas" iconPosition="start" />
        </Tabs>

        {tab === 0 && (
          <>
            {/* Filtros */}
            <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
              <TextField
                placeholder="Buscar..."
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
                  {ESTADOS.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Período</InputLabel>
                <Select value={filtroPeriodo} onChange={e => setFiltroPeriodo(e.target.value)} label="Período">
                  <MenuItem value="todos">Todos</MenuItem>
                  <MenuItem value="7dias">Últimos 7 días</MenuItem>
                  <MenuItem value="30dias">Últimos 30 días</MenuItem>
                </Select>
              </FormControl>
              {seleccionados.length >= 2 && (
                <Button
                  variant="contained"
                  startIcon={<MergeType />}
                  onClick={agruparIncidentes}
                  sx={{ bgcolor: "#005A7E", "&:hover": { bgcolor: "#003d5c" } }}
                >
                  Agrupar ({seleccionados.length})
                </Button>
              )}
            </Box>

            {/* Lista */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {incidentesFiltrados.map(inc => {
                const cfg = ESTADO_CONFIG[inc.estado] || ESTADO_CONFIG["Reportado"];
                const isSelected = seleccionados.includes(inc.id);
                return (
                  <Card
                    key={inc.id}
                    elevation={1}
                    sx={{
                      borderRadius: 2,
                      borderLeft: `4px solid ${cfg.color}`,
                      bgcolor: isSelected ? "#f0faf0" : "white",
                      outline: isSelected ? "2px solid #0B750E" : "none"
                    }}
                  >
                    <CardContent sx={{ display: "flex", gap: 2, alignItems: "center", py: "12px !important" }}>
                      <Checkbox
                        checked={isSelected}
                        onChange={e => {
                          e.stopPropagation();
                          setSeleccionados(prev =>
                            isSelected ? prev.filter(id => id !== inc.id) : [...prev, inc.id]
                          );
                        }}
                        sx={{ color: "#0B750E", "&.Mui-checked": { color: "#0B750E" } }}
                      />
                      {inc.imagenURL && (
                        <Box sx={{ width: 60, height: 60, borderRadius: 1.5, overflow: "hidden", flexShrink: 0 }}>
                          <img src={inc.imagenURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </Box>
                      )}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.3, flexWrap: "wrap" }}>
                          <Typography fontWeight="bold" variant="body2">{inc.tipo}</Typography>
                          <Chip label={inc.estado} size="small" sx={{ bgcolor: cfg.bg, color: cfg.color, fontSize: "0.65rem" }} />
                          {inc.grupoIncidenteId && <Chip label="Agrupado" size="small" sx={{ bgcolor: "#e3f2fd", color: "#005A7E", fontSize: "0.65rem" }} />}
                        </Box>
                        <Typography variant="caption" color="text.secondary" display="block" noWrap>{inc.descripcion}</Typography>
                        <Typography variant="caption" color="text.secondary">
                           {inc.usuarioNombre} |  {inc.ubicacionTexto} | {inc.fechaCreacion?.toDate?.()?.toLocaleDateString("es-CO") || ""}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, minWidth: 120 }}>
                        {ESTADOS.filter(e => e !== inc.estado).map(e => (
                          <Button
                            key={e}
                            size="small"
                            variant="outlined"
                            onClick={() => cambiarEstado(inc, e)}
                            sx={{
                              fontSize: "0.65rem", py: 0.3,
                              borderColor: ESTADO_CONFIG[e].color,
                              color: ESTADO_CONFIG[e].color,
                              "&:hover": { bgcolor: ESTADO_CONFIG[e].bg }
                            }}
                          >
                             {e}
                          </Button>
                        ))}
                        <Button size="small" variant="text" onClick={() => setIncidenteDetalle(inc)} sx={{ fontSize: "0.65rem", color: "#666" }}>
                          Ver detalle
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          </>
        )}

        {tab === 1 && (
          <Box className="estadisticas-print">
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
              <Button variant="outlined" onClick={imprimirEstadisticas} sx={{ borderColor: "#0B750E", color: "#0B750E" }}>
                 Imprimir estadísticas
              </Button>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
              {/* Gráfico por estado */}
              <Card elevation={1} sx={{ borderRadius: 2, p: 2 }}>
                <Typography fontWeight="bold" sx={{ mb: 2 }}>Incidentes por Estado</Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={datosEstado} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                      {datosEstado.map((_, i) => <Cell key={i} fill={Object.values(ESTADO_CONFIG)[i]?.color || COLORES_GRAFICO[i]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              {/* Gráfico por tipo */}
              <Card elevation={1} sx={{ borderRadius: 2, p: 2 }}>
                <Typography fontWeight="bold" sx={{ mb: 2 }}>Incidentes por Tipo</Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <ReBarChart data={datosTipo} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" name="Incidentes" radius={[0, 4, 4, 0]}>
                      {datosTipo.map((_, i) => <Cell key={i} fill={COLORES_GRAFICO[i % COLORES_GRAFICO.length]} />)}
                    </Bar>
                  </ReBarChart>
                </ResponsiveContainer>
              </Card>
            </Box>

            {/* Tabla resumen */}
            <Card elevation={1} sx={{ borderRadius: 2, p: 2, mt: 3 }}>
              <Typography fontWeight="bold" sx={{ mb: 2 }}>Resumen General</Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
                {datosEstado.map(d => (
                  <Box key={d.name} sx={{ textAlign: "center", p: 2, borderRadius: 2, bgcolor: ESTADO_CONFIG[d.name]?.bg || "#f5f5f5" }}>
                    <Typography variant="h3" fontWeight="bold" sx={{ color: ESTADO_CONFIG[d.name]?.color || "#222" }}>{d.value}</Typography>
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

      {/* Modal detalle */}
      <Dialog open={!!incidenteDetalle} onClose={() => setIncidenteDetalle(null)} maxWidth="sm" fullWidth>
        {incidenteDetalle && (() => {
          const cfg = ESTADO_CONFIG[incidenteDetalle.estado] || ESTADO_CONFIG["Reportado"];
          return (
            <>
              <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
                <Box>
                  <Typography fontWeight="bold">{incidenteDetalle.tipo}</Typography>
                  <Chip label={incidenteDetalle.estado} size="small" sx={{ bgcolor: cfg.bg, color: cfg.color, mt: 0.5 }} />
                </Box>
                <IconButton onClick={() => setIncidenteDetalle(null)}><Close /></IconButton>
              </DialogTitle>
              <DialogContent>
                {incidenteDetalle.imagenURL && (
                  <Box sx={{ mb: 2, borderRadius: 2, overflow: "hidden" }}>
                    <img src={incidenteDetalle.imagenURL} alt="" style={{ width: "100%", maxHeight: 280, objectFit: "cover" }} />
                  </Box>
                )}
                <Typography sx={{ mb: 1 }}>{incidenteDetalle.descripcion}</Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2" color="text.secondary"> {incidenteDetalle.usuarioNombre}</Typography>
                <Typography variant="body2" color="text.secondary"> {incidenteDetalle.ubicacionTexto}</Typography>
                <Typography variant="body2" color="text.secondary"> {incidenteDetalle.fechaCreacion?.toDate?.()?.toLocaleString("es-CO") || ""}</Typography>
                {incidenteDetalle.grupoIncidenteId && (
                  <Typography variant="body2" sx={{ mt: 1, color: "#005A7E" }}> Grupo: {incidenteDetalle.grupoIncidenteId}</Typography>
                )}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>Cambiar estado:</Typography>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    {ESTADOS.map(e => (
                      <Button
                        key={e}
                        size="small"
                        variant={incidenteDetalle.estado === e ? "contained" : "outlined"}
                        onClick={() => cambiarEstado(incidenteDetalle, e)}
                        sx={{
                          bgcolor: incidenteDetalle.estado === e ? ESTADO_CONFIG[e].color : "transparent",
                          borderColor: ESTADO_CONFIG[e].color,
                          color: incidenteDetalle.estado === e ? "white" : ESTADO_CONFIG[e].color,
                          "&:hover": { bgcolor: ESTADO_CONFIG[e].bg }
                        }}
                      >
                        {e}
                      </Button>
                    ))}
                  </Box>
                </Box>
                {incidenteDetalle.historialEstados?.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold">Historial:</Typography>
                    {incidenteDetalle.historialEstados.map((h, i) => (
                      <Typography key={i} variant="caption" display="block" color="text.secondary">
                        • {h.estado} — {new Date(h.fecha).toLocaleString("es-CO")} — {h.por}
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
