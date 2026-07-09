"use client";

import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";

import { styled, useTheme } from "@mui/material/styles";
import { useMediaQuery } from "@mui/material";
import InventoryIcon from "@mui/icons-material/Inventory2Outlined";
import ShoppingCartIcon from "@mui/icons-material/PointOfSaleOutlined";
import LocalMallIcon from "@mui/icons-material/LocalMallOutlined";
import LocalShippingIcon from "@mui/icons-material/LocalShippingOutlined";
import StorefrontIcon from "@mui/icons-material/StorefrontOutlined";
import DashboardIcon from "@mui/icons-material/SpaceDashboardOutlined";
import PeopleIcon from "@mui/icons-material/GroupsOutlined";
import BadgeIcon from "@mui/icons-material/BadgeOutlined";
import SettingsIcon from "@mui/icons-material/SettingsOutlined";
import AssessmentIcon from "@mui/icons-material/AssessmentOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBackOutlined";
import LocalPharmacyIcon from "@mui/icons-material/LocalPharmacy";
import Link from "next/link";
import { usePathname } from "next/navigation";

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  padding: theme.spacing(2.5, 2),
  background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
  color: theme.palette.primary.contrastText,
}));

const DRAWER_WIDTH = 250;

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileToggle?: () => void;
}

const menuGroups = [
  {
    label: "General",
    items: [{ text: "Inicio", icon: <DashboardIcon />, href: "/dashboard" }],
  },
  {
    label: "Operaciones",
    items: [
      { text: "Productos", icon: <StorefrontIcon />, href: "/products" },
      { text: "Inventario", icon: <InventoryIcon />, href: "/inventory" },
      { text: "Ventas", icon: <ShoppingCartIcon />, href: "/sells" },
      { text: "Órdenes de compra", icon: <LocalMallIcon />, href: "/orders" },
      { text: "Proveedores", icon: <LocalShippingIcon />, href: "/suppliers" },
    ],
  },
  {
    label: "Administración",
    items: [
      { text: "Empleados", icon: <BadgeIcon />, href: "/employees" },
      { text: "Usuarios", icon: <PeopleIcon />, href: "/users" },
      { text: "Reportes", icon: <AssessmentIcon />, href: "/validations" },
      { text: "Configuración", icon: <SettingsIcon />, href: "/configuracion" },
    ],
  },
];

export function Sidebar({ mobileOpen = false, onMobileToggle }: SidebarProps = {}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const pathname = usePathname();

  const drawerContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <DrawerHeader>
        <LocalPharmacyIcon sx={{ fontSize: 28 }} />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
            BioFarm
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.85 }}>
            Panel de gestión
          </Typography>
        </Box>
      </DrawerHeader>

      <Box sx={{ flexGrow: 1, overflowY: "auto", py: 1 }}>
        {menuGroups.map((group) => (
          <Box key={group.label} sx={{ mb: 1 }}>
            <Typography
              variant="overline"
              sx={{
                px: 2.5,
                color: "text.secondary",
                fontWeight: 700,
                fontSize: "0.7rem",
                letterSpacing: "0.08em",
              }}
            >
              {group.label}
            </Typography>
            <List sx={{ py: 0.5 }}>
              {group.items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname?.startsWith(item.href));
                return (
                  <ListItem
                    key={item.text}
                    component={Link}
                    href={item.href}
                    onClick={isMobile ? onMobileToggle : undefined}
                    sx={{
                      color: active ? "primary.dark" : "text.primary",
                      backgroundColor: active ? "rgba(14, 124, 102, 0.1)" : "transparent",
                      fontWeight: active ? 700 : 500,
                      "&:hover": {
                        backgroundColor: active
                          ? "rgba(14, 124, 102, 0.14)"
                          : "rgba(14, 124, 102, 0.06)",
                      },
                      borderRadius: 2,
                      mx: 1.5,
                      mb: 0.25,
                      transition: "background-color 0.15s ease",
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 38,
                        color: active ? "primary.main" : "text.secondary",
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      sx={{
                        "& .MuiListItemText-primary": {
                          fontSize: { xs: "0.875rem", sm: "0.9rem" },
                          fontWeight: active ? 700 : 500,
                        },
                      }}
                    />
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      <Divider />
      <ListItem
        component={Link}
        href="/"
        onClick={isMobile ? onMobileToggle : undefined}
        sx={{
          color: "text.secondary",
          mx: 1.5,
          my: 1,
          borderRadius: 2,
          width: "auto",
          "&:hover": { backgroundColor: "rgba(14, 124, 102, 0.06)" },
        }}
      >
        <ListItemIcon sx={{ minWidth: 38, color: "text.secondary" }}>
          <ArrowBackIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText
          primary="Volver al sitio"
          sx={{ "& .MuiListItemText-primary": { fontSize: "0.85rem" } }}
        />
      </ListItem>
    </Box>
  );

  return (
    <Box component="nav">
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: DRAWER_WIDTH,
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}
