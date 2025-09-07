"use client";

import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { styled } from "@mui/material/styles";
import InventoryIcon from "@mui/icons-material/Inventory";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LocalMallIcon from "@mui/icons-material/LocalMall";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import StorefrontIcon from "@mui/icons-material/Storefront";
import HomeIcon from "@mui/icons-material/Home";
import PeopleIcon from "@mui/icons-material/People";
import SettingsIcon from "@mui/icons-material/Settings";
import Link from "next/link";

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(2),
  justifyContent: "center",
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
}));

const DRAWER_WIDTH = 240;

export function Sidebar() {
  const menuItems = [
    { text: "Inicio", icon: <HomeIcon />, href: "/" },
    { text: "Productos", icon: <StorefrontIcon />, href: "/products" },
    { text: "Inventario", icon: <InventoryIcon />, href: "/inventory" },
    { text: "Ventas", icon: <ShoppingCartIcon />, href: "/sells" },
    { text: "Órdenes", icon: <LocalMallIcon />, href: "/orders" },
    { text: "Empleados", icon: <PeopleIcon />, href: "/employees" },
    { text: "Proveedores", icon: <LocalShippingIcon />, href: "/suppliers" },
    // { text: "Usuarios", icon: <PeopleIcon />, href: "/users" },
    { text: "Configuración", icon: <SettingsIcon />, href: "/configuration" },
  ];

  return (
    <Box component="nav">
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
          },
        }}
      >
        <DrawerHeader>
          <Typography variant="h6">Quimifarm</Typography>
        </DrawerHeader>
        <List>
          {menuItems.map((item) => (
            <ListItem
              key={item.text}
              component={Link}
              href={item.href}
              sx={{
                "&:hover": {
                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Drawer>
    </Box>
  );
}
