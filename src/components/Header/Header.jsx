import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar, Toolbar, Typography, Avatar, Button, IconButton,
  Badge, Popover, List, ListItem, ListItemText, Box,
  Divider, Drawer, Chip
} from "@mui/material";
import {
  Logout, NotificationsOutlined, Menu, Close, Security,
  CheckCircle, ArrowBack
} from "@mui/icons-material";
import uaOriginalLogo from "../../assets/UAOriginal.png";
import "./Header.css";

export default function Header({
  tipo = "landing", // 'landing' | 'register' | 'usuario' | 'admin'
  usuario = null,
  cerrarSesion = null,
  incidentesPendientes = [],
  scrollAPortal = null
}) {
  const navigate = useNavigate();
  const [campanaAnchor, setCampanaAnchor] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleCampanaClick = (event) => {
    setCampanaAnchor(event.currentTarget);
  };

  const handleCampanaClose = () => {
    setCampanaAnchor(null);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleCerrarSesionClick = async () => {
    if (cerrarSesion) {
      try {
        await cerrarSesion();
        navigate("/");
      } catch (err) {
        console.error("Error al cerrar sesión:", err);
      }
    }
  };

  // Render para cada tipo de Header
  const renderContenido = () => {
    if (tipo === "landing") {
      return (
        <>
          {/* Logo y Nombre */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer" }} onClick={() => navigate("/")}>
            <div className="header__logo-container">
              <img src={uaOriginalLogo} alt="UA Logo" className="header__logo" />
            </div>
            <Typography variant="h6" className="header__brand-title">
              UA Incidentes
            </Typography>
          </Box>

          {/* Botones de acción desktop */}
          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 2 }}>
            <Button
              variant="text"
              onClick={scrollAPortal}
              className="header__btn-nav text-white"
            >
              Cómo funciona
            </Button>
            <Button
              variant="outlined"
              onClick={scrollAPortal}
              className="header__btn-outlined"
            >
              Acceder
            </Button>
          </Box>

          {/* Menú mobile */}
          <Box sx={{ display: { xs: "flex", md: "none" } }}>
            <IconButton color="inherit" onClick={handleDrawerToggle} sx={{ color: "white" }}>
              <Menu />
            </IconButton>
          </Box>
        </>
      );
    }

    if (tipo === "register") {
      return (
        <>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer" }} onClick={() => navigate("/")}>
            <div className="header__logo-container">
              <img src={uaOriginalLogo} alt="UA Logo" className="header__logo" />
            </div>
            <Typography variant="h6" className="header__brand-title">
              UA Incidentes
            </Typography>
          </Box>

          <Button
            variant="outlined"
            onClick={() => navigate("/")}
            startIcon={<ArrowBack />}
            className="header__btn-outlined"
          >
            Volver al Inicio
          </Button>
        </>
      );
    }

    if (tipo === "usuario" || tipo === "admin") {
      const isAdmin = tipo === "admin";
      return (
        <>
          {/* Logo y Nombre */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer" }} onClick={() => navigate(isAdmin ? "/admin" : "/usuario")}>
            <div className="header__logo-container">
              <img src={uaOriginalLogo} alt="UA Logo" className="header__logo" />
            </div>
            <Typography variant="h6" className="header__brand-title">
              {isAdmin ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Security sx={{ fontSize: 20 }} /> Panel Administrador
                </Box>
              ) : (
                "UA Incidentes"
              )}
            </Typography>
          </Box>

          {/* Info y Acciones desktop */}
          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 2 }}>
            {isAdmin && (
              <IconButton color="inherit" onClick={handleCampanaClick} className="header__bell-btn">
                <Badge badgeContent={incidentesPendientes.length} color="error">
                  <NotificationsOutlined />
                </Badge>
              </IconButton>
            )}

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }} className="header__user-pill">
              <Typography variant="body2" className="header__username">
                {usuario?.displayName || (usuario?.email ? usuario.email.split("@")[0] : "")}
              </Typography>
              
              <div className="header__avatar-wrapper">
                <Avatar sx={{ bgcolor: isAdmin ? "#E81312" : "#0B750E", width: 36, height: 36, fontSize: 14, fontWeight: "bold" }}>
                  {(usuario?.displayName || usuario?.email || "U")[0].toUpperCase()}
                </Avatar>
                <span className={`header__status-indicator ${isAdmin ? "status-admin" : "status-user"}`} />
              </div>
            </Box>

            <IconButton
              color="inherit"
              onClick={handleCerrarSesionClick}
              className="header__logout-btn"
              title="Cerrar sesión"
            >
              <Logout />
            </IconButton>
          </Box>

          {/* Iconos/Menú mobile */}
          <Box sx={{ display: { xs: "flex", md: "none" }, alignItems: "center", gap: 1 }}>
            {isAdmin && (
              <IconButton color="inherit" onClick={handleCampanaClick} className="header__bell-btn">
                <Badge badgeContent={incidentesPendientes.length} color="error">
                  <NotificationsOutlined />
                </Badge>
              </IconButton>
            )}
            <IconButton color="inherit" onClick={handleDrawerToggle} sx={{ color: "white" }}>
              <Menu />
            </IconButton>
          </Box>
        </>
      );
    }
  };

  // Drawer lateral para móviles
  const renderDrawer = () => {
    const isLogged = tipo === "usuario" || tipo === "admin";
    const isAdmin = tipo === "admin";

    return (
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        PaperProps={{
          className: "header__drawer-paper"
        }}
      >
        <Box sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
            <Typography variant="h6" className="header__drawer-title">
              UA Incidentes
            </Typography>
            <IconButton onClick={handleDrawerToggle} sx={{ color: "white" }}>
              <Close />
            </IconButton>
          </Box>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mb: 4 }} />

          {isLogged ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3, flexGrow: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 2, bgcolor: "rgba(255,255,255,0.05)", borderRadius: 4 }}>
                <Avatar sx={{ bgcolor: isAdmin ? "#E81312" : "#0B750E", width: 44, height: 44, fontSize: 16, fontWeight: "bold" }}>
                  {(usuario?.displayName || usuario?.email || "U")[0].toUpperCase()}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ color: "white" }} noWrap>
                    {usuario?.displayName || (usuario?.email || "").split("@")[0]}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }} noWrap>
                    {usuario?.email}
                  </Typography>
                </Box>
              </Box>

              <Button
                variant="contained"
                startIcon={<Logout />}
                onClick={() => {
                  handleDrawerToggle();
                  handleCerrarSesionClick();
                }}
                className="header__drawer-logout-btn"
                fullWidth
              >
                Cerrar Sesión
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, flexGrow: 1 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  handleDrawerToggle();
                  if (scrollAPortal) scrollAPortal();
                }}
                className="header__btn-outlined"
                fullWidth
              >
                Acceder
              </Button>
            </Box>
          )}

          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.3)", textAlign: "center", mt: "auto" }}>
            UA Incidentes v1.0.0
          </Typography>
        </Box>
      </Drawer>
    );
  };

  return (
    <>
      <AppBar position="static" className="header__appbar">
        <Toolbar className="header__toolbar">
          {renderContenido()}
        </Toolbar>
      </AppBar>

      {/* Drawer Móvil */}
      {renderDrawer()}

      {/* Popover Notificaciones para Admin */}
      {tipo === "admin" && (
        <Popover
          open={Boolean(campanaAnchor)}
          anchorEl={campanaAnchor}
          onClose={handleCampanaClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{
            className: "header__popover-paper"
          }}
        >
          <Box sx={{ maxHeight: 400, overflow: "auto" }}>
            <Box className="header__popover-title-bar">
              <Typography fontWeight="800" sx={{ display: "flex", alignItems: "center", gap: 1, color: "white", fontSize: "0.9rem" }}>
                <NotificationsOutlined sx={{ fontSize: 18, color: "white" }} />
                Incidentes Pendientes ({incidentesPendientes.length})
              </Typography>
            </Box>

            {incidentesPendientes.length === 0 ? (
              <Box sx={{ p: 4, textAlign: "center", color: "#666666" }}>
                <CheckCircle sx={{ fontSize: 40, color: "#0B750E", opacity: 0.8, mb: 1.5 }} />
                <Typography variant="body2" fontWeight="500">¡Excelente! No hay pendientes.</Typography>
              </Box>
            ) : (
              <List dense sx={{ py: 0 }}>
                {incidentesPendientes.slice(0, 10).map((inc, i) => {
                  const fecha = inc.fechaCreacion?.toDate ? inc.fechaCreacion.toDate() : (inc.fechaCreacion ? new Date(inc.fechaCreacion) : null);
                  const diffHoras = fecha ? (new Date() - fecha) / (1000 * 60 * 60) : 0;
                  const esNuevo = !fecha || diffHoras < 2;

                  return (
                    <ListItem key={inc.id} divider={i < incidentesPendientes.length - 1} className="header__notification-item">
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, justifyContent: "space-between" }}>
                            <Typography variant="body2" fontWeight="bold" color="#1c1c1f" noWrap sx={{ maxWidth: 170 }}>
                              {inc.tipo}
                            </Typography>
                            {esNuevo ? (
                              <Chip label="Nuevo" size="small" className="chip-notification-new" />
                            ) : (
                              <Chip label="Pendiente" size="small" className="chip-notification-pending" />
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" sx={{ color: "#666666", display: "block", mt: 0.5 }}>
                            {inc.usuarioNombre || "Usuario"} · {fecha ? fecha.toLocaleDateString("es-CO") : "Reciente"}
                          </Typography>
                        }
                      />
                    </ListItem>
                  );
                })}
                {incidentesPendientes.length > 10 && (
                  <ListItem className="header__notification-more">
                    <ListItemText
                      primary={
                        <Typography variant="caption" sx={{ color: "#0B750E", fontWeight: "bold" }}>
                          +{incidentesPendientes.length - 10} más por revisar en la lista principal
                        </Typography>
                      }
                    />
                  </ListItem>
                )}
              </List>
            )}
          </Box>
        </Popover>
      )}
    </>
  );
}
