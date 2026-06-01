import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../FireBase/config";
import { useAuth } from "../../context/AuthContext";
import { subirImagen } from "../../utils/cloudinary";
import {
  Box, TextField, Button, Typography, Alert, Select, MenuItem,
  FormControl, InputLabel, CircularProgress, Paper, Chip
} from "@mui/material";
import { CloudUpload, MyLocation, LocationOn } from "@mui/icons-material";

const TIPOS = [
  "Fuga de agua",
  "Problema eléctrico",
  "Infraestructura dañada",
  "Problema de seguridad",
  "Daño en mobiliario",
  "Problema de saneamiento",
  "Otro",
];

export default function FormularioIncidente({ onCerrar }) {
  const { usuario } = useAuth();
  const [tipo, setTipo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [ubicacionTexto, setUbicacionTexto] = useState("");
  const [latitud, setLatitud] = useState(null);
  const [longitud, setLongitud] = useState(null);
  const [imagen, setImagen] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  function handleImagen(e) {
    const file = e.target.files[0];
    if (file) {
      setImagen(file);
      setPreview(URL.createObjectURL(file));
    }
  }

  function obtenerGPS() {
    if (!navigator.geolocation) { setError("GPS no disponible en este dispositivo"); return; }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitud(pos.coords.latitude);
        setLongitud(pos.coords.longitude);
        setUbicacionTexto(`GPS: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        setGeoLoading(false);
      },
      () => { setError("No se pudo obtener la ubicación GPS"); setGeoLoading(false); }
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!tipo || !descripcion || !ubicacionTexto || !imagen) {
      setError("Tipo, descripción, ubicación e imagen son obligatorios");
      return;
    }
    setCargando(true);
    try {
      const imagenURL = await subirImagen(imagen);
      await addDoc(collection(db, "incidentes"), {
        usuarioId: usuario.uid,
        usuarioNombre: usuario.displayName || usuario.email,
        tipo,
        descripcion,
        imagenURL,
        ubicacionTexto,
        latitud: latitud || null,
        longitud: longitud || null,
        fechaCreacion: serverTimestamp(),
        estado: "Reportado",
        grupoIncidenteId: null,
        historialEstados: [{ estado: "Reportado", fecha: new Date().toISOString(), por: usuario.email }],
      });
      setExito(true);
      setTimeout(() => { onCerrar && onCerrar(); }, 1500);
    } catch (err) {
      setError("Error al registrar el incidente: " + err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: "#0B750E" }}>
        📋 Nuevo Incidente
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {exito && <Alert severity="success" sx={{ mb: 2 }}>¡Incidente registrado exitosamente!</Alert>}

      <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <FormControl fullWidth>
          <InputLabel>Tipo de incidente</InputLabel>
          <Select value={tipo} onChange={e => setTipo(e.target.value)} label="Tipo de incidente">
            {TIPOS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </Select>
        </FormControl>

        <TextField
          label="Descripción detallada"
          multiline rows={3}
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          fullWidth
          inputProps={{ maxLength: 500 }}
          helperText={`${descripcion.length}/500`}
        />

        <Box>
          <TextField
            label="Ubicación (ej: Bloque A, Baño 2do piso)"
            value={ubicacionTexto}
            onChange={e => setUbicacionTexto(e.target.value)}
            fullWidth
            InputProps={{
              endAdornment: (
                <Button
                  size="small"
                  onClick={obtenerGPS}
                  disabled={geoLoading}
                  startIcon={geoLoading ? <CircularProgress size={14} /> : <MyLocation />}
                  sx={{ color: "#0B750E", minWidth: 100 }}
                >
                  GPS
                </Button>
              )
            }}
          />
          {latitud && (
            <Chip
              icon={<LocationOn />}
              label={`${latitud.toFixed(4)}, ${longitud.toFixed(4)}`}
              size="small" sx={{ mt: 0.5, bgcolor: "#e8f5e9" }}
            />
          )}
        </Box>

        {/* Upload imagen */}
        <Box>
          <input type="file" accept="image/*" id="img-upload" style={{ display: "none" }} onChange={handleImagen} />
          <label htmlFor="img-upload">
            <Button
              component="span"
              variant="outlined"
              startIcon={<CloudUpload />}
              fullWidth
              sx={{ borderColor: "#0B750E", color: "#0B750E", py: 1.5, borderStyle: "dashed" }}
            >
              {imagen ? imagen.name : "Subir fotografía (obligatorio)"}
            </Button>
          </label>
          {preview && (
            <Box sx={{ mt: 1, borderRadius: 2, overflow: "hidden", maxHeight: 200 }}>
              <img src={preview} alt="preview" style={{ width: "100%", objectFit: "cover", maxHeight: 200 }} />
            </Box>
          )}
        </Box>

        <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={onCerrar}
            sx={{ borderColor: "#ccc", color: "#666" }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={cargando}
            sx={{ bgcolor: "#0B750E", "&:hover": { bgcolor: "#064d08" } }}
          >
            {cargando ? <CircularProgress size={22} sx={{ color: "white" }} /> : "Reportar Incidente"}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
