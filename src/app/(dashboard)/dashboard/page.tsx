"use client";

import { useEffect, useState } from "react";
import { Box, Paper, Typography, Grid, Card, CardActionArea, CardContent } from "@mui/material";
import StorefrontIcon from "@mui/icons-material/StorefrontOutlined";
import InventoryIcon from "@mui/icons-material/Inventory2Outlined";
import PointOfSaleIcon from "@mui/icons-material/PointOfSaleOutlined";
import LocalMallIcon from "@mui/icons-material/LocalMallOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmberOutlined";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import DashboardIcon from "@mui/icons-material/SpaceDashboardOutlined";

interface Stats {
  products: number;
  lowStock: number;
  sellsToday: number;
  pendingOrders: number;
}

export default function DashboardHomePage() {
  const [stats, setStats] = useState<Stats>({
    products: 0,
    lowStock: 0,
    sellsToday: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [productsRes, inventoryRes, sellsRes, ordersRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/inventory"),
          fetch("/api/sells"),
          fetch("/api/orders"),
        ]);
        const [products, inventory, sells, orders] = await Promise.all([
          productsRes.ok ? productsRes.json() : [],
          inventoryRes.ok ? inventoryRes.json() : [],
          sellsRes.ok ? sellsRes.json() : [],
          ordersRes.ok ? ordersRes.json() : [],
        ]);

        const today = new Date().toISOString().slice(0, 10);
        const lowStock = Array.isArray(inventory)
          ? inventory.filter((i) => Number(i.quantity_available) <= 10).length
          : 0;
        const sellsToday = Array.isArray(sells)
          ? sells.filter((s) => String(s.sell_date).slice(0, 10) === today).length
          : 0;
        const pendingOrders = Array.isArray(orders)
          ? orders.filter((o) => o.status === "pendiente").length
          : 0;

        setStats({
          products: Array.isArray(products) ? products.length : 0,
          lowStock,
          sellsToday,
          pendingOrders,
        });
      } catch {
        // Silenciamos errores de red; las tarjetas muestran 0 por defecto.
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const cards = [
    {
      label: "Productos activos",
      value: stats.products,
      icon: <StorefrontIcon />,
      href: "/products",
      color: "#0E7C66",
    },
    {
      label: "Lotes con stock bajo",
      value: stats.lowStock,
      icon: <WarningAmberIcon />,
      href: "/inventory",
      color: "#E8720C",
    },
    {
      label: "Ventas de hoy",
      value: stats.sellsToday,
      icon: <PointOfSaleIcon />,
      href: "/sells",
      color: "#2563EB",
    },
    {
      label: "Órdenes pendientes",
      value: stats.pendingOrders,
      icon: <LocalMallIcon />,
      href: "/orders",
      color: "#7C3AED",
    },
  ];

  return (
    <Box sx={{ width: "100%", height: "100%", p: { xs: 1, sm: 3 } }}>
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <PageHeader
          title="Panel de BioFarm"
          subtitle="Resumen general de la operación de la farmacia"
          icon={<DashboardIcon />}
        />

        <Grid container spacing={2}>
          {cards.map((card) => (
            <Grid item xs={12} sm={6} md={3} key={card.label}>
              <Card variant="outlined">
                <CardActionArea component={Link} href={card.href}>
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        bgcolor: `${card.color}1A`,
                        color: card.color,
                        mb: 1.5,
                      }}
                    >
                      {card.icon}
                    </Box>
                    <Typography variant="h4" sx={{ fontSize: "1.75rem" }}>
                      {loading ? "…" : card.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.label}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Accesos rápidos
        </Typography>
        <Grid container spacing={1.5}>
          {[
            { label: "Inventario", icon: <InventoryIcon />, href: "/inventory" },
            { label: "Órdenes de compra", icon: <LocalMallIcon />, href: "/orders" },
            { label: "Reportes", icon: <WarningAmberIcon />, href: "/reports" },
          ].map((item) => (
            <Grid item xs={12} sm={4} key={item.label}>
              <Card variant="outlined">
                <CardActionArea component={Link} href={item.href} sx={{ p: 1.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box sx={{ color: "primary.main", display: "flex" }}>{item.icon}</Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {item.label}
                    </Typography>
                  </Box>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
}
