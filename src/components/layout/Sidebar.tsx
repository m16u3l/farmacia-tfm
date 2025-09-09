"use client";

import { useState } from "react";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import MenuIcon from "@mui/icons-material/Menu";
import { styled, useTheme } from "@mui/material/styles";
import { useMediaQuery } from "@mui/material";
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

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileToggle?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileToggle }: SidebarProps = {}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const menuItems = [
    { text: "Inicio", icon: <HomeIcon />, href: "/" },
    { text: "Productos", icon: <StorefrontIcon />, href: "/products" },
    { text: "Inventario", icon: <InventoryIcon />, href: "/inventory" },
    { text: "Ventas", icon: <ShoppingCartIcon />, href: "/sells" },
    { text: "Órdenes", icon: <LocalMallIcon />, href: "/orders" },
    { text: "Empleados", icon: <PeopleIcon />, href: "/employees" },
    { text: "Proveedores", icon: <LocalShippingIcon />, href: "/suppliers" },
    { text: "Usuarios", icon: <PeopleIcon />, href: "/users" },
    { text: "Configuración", icon: <SettingsIcon />, href: "/configuracion" },
    { text: "Email", icon: <SettingsIcon />, href: "/email" },
  ];

  const drawerContent = (
    <>
      <DrawerHeader>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          BioFarm
        </Typography>
      </DrawerHeader>
      <List>
        {menuItems.map((item) => (
          <ListItem
            key={item.text}
            component={Link}
            href={item.href}
            onClick={isMobile ? onMobileToggle : undefined}
            sx={{
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.04)",
              },
              borderRadius: 1,
              mx: 1,
              mb: 0.5,
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText 
              primary={item.text} 
              sx={{
                '& .MuiListItemText-primary': {
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }
              }}
            />
          </ListItem>
        ))}
      </List>
    </>
  );

  return (
    <Box component="nav">
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
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
          display: { xs: 'none', md: 'block' },
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
