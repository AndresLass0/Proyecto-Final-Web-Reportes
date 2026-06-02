import { useState, useEffect, useRef } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../FireBase/config";
import { useAuth } from "../../context/AuthContext";
import { subirImagen } from "../../utils/cloudinary";
import { loadGoogleMaps } from "../../utils/googleMaps";
import Swal from "sweetalert2";
import {
  Box, TextField, Button, Typography, Select, MenuItem,
  FormControl, InputLabel, CircularProgress, Paper, Chip
} from "@mui/material";
import { CloudUpload, MyLocation, LocationOn, Assignment } from "@mui/icons-material";

const TIPOS = [
  "Fuga de agua", "Problema eléctrico", "Infraestructura dañada",
  "Problema de seguridad", "Daño en mobiliario", "Problema de saneamiento", "Otro",
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
  const [cargando, setCargando] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);

  useEffect(() => {
    loadGoogleMaps("AIzaSyAch4GiG6bKokBQK-1h4x3N44So0AYfyRw")
      .then((google) => {
        if (!mapRef.current) return;
        const defaultCenter = { lat: 1.6142, lng: -75.6062 }; // Universidad de la Amazonia
        
        const mapObj = new google.maps.Map(mapRef.current, {
          center: defaultCenter,
          zoom: 16,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
            { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#4b6878" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] }
          ]
        });
        
        const markerObj = new google.maps.Marker({
          position: defaultCenter,
          map: mapObj,
          draggable: true,
          title: "Ubicación del incidente",
          animation: google.maps.Animation.DROP
        });

        mapInstance.current = mapObj;
        markerInstance.current = markerObj;

        // Establecer latitud y longitud iniciales
        setLatitud(defaultCenter.lat);
        setLongitud(defaultCenter.lng);

        // Evento drag del marcador
        markerObj.addListener("dragend", () => {
          const pos = markerObj.getPosition();
          setLatitud(pos.lat());
          setLongitud(pos.lng());
        });

        // Evento click en el mapa
        mapObj.addListener("click", (e) => {
          const pos = e.latLng;
          markerObj.setPosition(pos);
          setLatitud(pos.lat());
          setLongitud(pos.lng());
        });
      })
      .catch((err) => {
        console.error("Error al cargar Google Maps:", err);
      });
  }, []);

  function handleImagen(e) {
    const file = e.target.files[0];
    if (file) { setImagen(file); setPreview(URL.createObjectURL(file)); }
  }

  function obtenerGPS() {
    if (!navigator.geolocation) { Swal.fire({ icon: "warning", title: "GPS no disponible", confirmButtonColor: "#10b981" }); return; }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitud(lat);
        setLongitud(lng);
        
        if (mapInstance.current && markerInstance.current && window.google) {
          const newPos = new window.google.maps.LatLng(lat, lng);
          mapInstance.current.setCenter(newPos);
          mapInstance.current.setZoom(17);
          markerInstance.current.setPosition(newPos);
        }
        setGeoLoading(false);
      },
      () => { Swal.fire({ icon: "error", title: "No se pudo obtener GPS", confirmButtonColor: "#ef4444" }); setGeoLoading(false); }
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!tipo || !descripcion || !ubicacionTexto || !imagen) {
      Swal.fire({ icon: "warning", title: "Campos incompletos", text: "Tipo, descripción, ubicación e imagen son obligatorios", confirmButtonColor: "#10b981" });
      return;
    }
    setCargando(true);
    try {
      const imagenURL = await subirImagen(imagen);
      await addDoc(collection(db, "incidentes"), {
        usuarioId: usuario.uid,
        usuarioNombre: usuario.displayName || usuario.email,
        tipo, descripcion, imagenURL, ubicacionTexto,
        latitud: latitud || null, longitud: longitud || null,
        fechaCreacion: serverTimestamp(),
        estado: "Reportado",
        grupoIncidenteId: null,
        historialEstados: [{ estado: "Reportado", fecha: new Date().toISOString(), por: usuario.email }],
      });
      await Swal.fire({ icon: "success", title: "¡Incidente registrado!", text: "Tu reporte fue enviado exitosamente.", timer: 1800, showConfirmButton: false });
      onCerrar && onCerrar();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error al registrar", text: err.message, confirmButtonColor: "#ef4444" });
    } finally {
      setCargando(false);
    }
  }

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      "& fieldset": { borderColor: "rgba(255, 255, 255, 0.08)" },
      "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.2)" },
      "&.Mui-focused fieldset": { borderColor: "#10b981" },
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.5, bgcolor: "transparent" }}>
      
      <FormControl fullWidth sx={fieldSx}>
        <InputLabel sx={{ color: "rgba(255,255,255,0.4)" }}>Tipo de incidente</InputLabel>
        <Select value={tipo} onChange={e => setTipo(e.target.value)} label="Tipo de incidente" sx={{ color: "white" }}>
          {TIPOS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </Select>
      </FormControl>

      <TextField
        label="Descripción detallada" multiline rows={3} value={descripcion}
        onChange={e => setDescripcion(e.target.value)} fullWidth inputProps={{ maxLength: 500 }}
        helperText={<Typography variant="caption" sx={{ color: "rgba(255,255,255,0.3)" }}>{`${descripcion.length}/500`}</Typography>}
        sx={fieldSx}
      />

      <Box>
        <TextField
          label="Ubicación (ej: Bloque A, Baño 2do piso)" value={ubicacionTexto}
          onChange={e => setUbicacionTexto(e.target.value)} fullWidth sx={fieldSx}
          InputProps={{
            endAdornment: (
              <Button size="small" onClick={obtenerGPS} disabled={geoLoading}
                startIcon={geoLoading ? <CircularProgress size={14} /> : <MyLocation />}
                sx={{ color: "#10b981", minWidth: 80, fontWeight: "bold" }}>GPS</Button>
            )
          }}
        />
        
        <Box sx={{ mt: 2, mb: 1.5 }}>
          <Typography variant="caption" sx={{ mb: 1, fontWeight: "bold", color: "rgba(255,255,255,0.5)", display: "block" }}>
            Selecciona la ubicación exacta en el mapa (puedes arrastrar el marcador):
          </Typography>
          <div ref={mapRef} style={{ width: "100%", height: "200px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 4px 15px rgba(0,0,0,0.3)" }} />
        </Box>

        {latitud && (
          <Chip
            icon={<LocationOn sx={{ color: "#10b981 !important" }} />}
            label={`Coordenadas: ${latitud.toFixed(5)}, ${longitud.toFixed(5)}`}
            size="small"
            sx={{
              mt: 0.5, bgcolor: "rgba(16, 185, 129, 0.12)", color: "#10b981", fontWeight: "bold",
              border: "1px solid rgba(16, 185, 129, 0.25)"
            }}
          />
        )}
      </Box>

      <Box>
        <input type="file" accept="image/*" id="img-upload" style={{ display: "none" }} onChange={handleImagen} />
        <label htmlFor="img-upload">
          <Button component="span" variant="outlined" startIcon={<CloudUpload />} fullWidth className="btn-interactive"
            sx={{
              borderColor: "rgba(16, 185, 129, 0.4)", color: "#10b981", py: 1.8, borderStyle: "dashed", borderRadius: 3,
              bgcolor: "rgba(16, 185, 129, 0.03)",
              "&:hover": { borderColor: "#10b981", bgcolor: "rgba(16, 185, 129, 0.08)" }
            }}>
            {imagen ? imagen.name : "Subir fotografía (obligatorio)"}
          </Button>
        </label>
        {preview && (
          <Box sx={{ mt: 1.5, borderRadius: 3, overflow: "hidden", maxHeight: 200, border: "1px solid rgba(255,255,255,0.08)" }}>
            <img src={preview} alt="preview" style={{ width: "100%", objectFit: "cover", maxHeight: 200 }} />
          </Box>
        )}
      </Box>

      <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
        <Button variant="outlined" fullWidth onClick={onCerrar} className="btn-interactive"
          sx={{ borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)", borderRadius: 3, py: 1.2, "&:hover": { borderColor: "white", bgcolor: "rgba(255,255,255,0.03)" } }}>
          Cancelar
        </Button>
        <Button type="submit" variant="contained" fullWidth disabled={cargando} className="btn-interactive"
          sx={{ bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" }, borderRadius: 3, py: 1.2, fontWeight: "bold", boxShadow: "0 6px 15px rgba(16, 185, 129, 0.35)" }}>
          {cargando ? <CircularProgress size={22} sx={{ color: "white" }} /> : "Reportar Incidente"}
        </Button>
      </Box>

    </Box>
  );
}
