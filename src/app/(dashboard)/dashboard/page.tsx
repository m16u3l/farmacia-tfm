"use client";

import { useEffect, useState } from "react";
import { Box, Paper, Typography, Grid, Card, CardActionArea, CardContent, Skeleton } from "@mui/material";
import StorefrontIcon from "@mui/icons-material/StorefrontOutlined";
import InventoryIcon from "@mui/icons-material/Inventory2Outlined";
import PointOfSaleIcon from "@mui/icons-material/PointOfSaleOutlined";
import LocalMallIcon from "@mui/icons-material/LocalMallOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmberOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import DashboardIcon from "@mui/icons-material/SpaceDashboardOutlined";

interface Stats {
  products: number;
  lowStock: number;
  sellsToday: number;
  pendingOrders: number;
  // null = sin dato (p. ej. rol sin acceso a inventory-validations): se oculta.
  validationCoverage: number | null;
}

export default function DashboardHomePage() {
  const [stats, setStats] = useState<Stats>({
    products: 0,
    lowStock: 0,
    sellsToday: 0,
    pendingOrders: 0,
    validationCoverage: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, coverageRes] = await Promise.all([
          fetch("/api/dashboard/stats"),
          // 403 para roles sin acceso a inventory-validations: la tarjeta se oculta.
          fetch("/api/inventory-validations/coverage"),
        ]);
        const [data, coverage] = await Promise.all([
          statsRes.ok ? statsRes.json() : null,
          coverageRes.ok ? coverageRes.json() : null,
        ]);

        setStats({
          products: data?.products ?? 0,
          lowStock: data?.low_stock_lots ?? 0,
          sellsToday: data?.sells_today ?? 0,
          pendingOrders: data?.pending_orders ?? 0,
          validationCoverage:
            coverage && typeof coverage.coverage_percent === "number"
              ? coverage.coverage_percent
              : null,
        });
      } catch {
        // Silenciamos errores de red; las tarjetas muestran 0 por defecto.
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const cards: { label: string; value: number | string; icon: React.ReactNode; href: string; color: string }[] = [
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

  if (stats.validationCoverage !== null) {
    cards.push({
      label: "Inventario validado",
      value: `${stats.validationCoverage}%`,
      icon: <FactCheckOutlinedIcon />,
      href: "/inventory-validations",
      color: stats.validationCoverage === 100 ? "#0E7C66" : "#E8720C",
    });
  }

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <PageHeader
          title="Panel de BioFarm"
          subtitle="Resumen general de la operación de la farmacia"
          icon={<DashboardIcon />}
        />

        <Grid container spacing={2}>
          {cards.map((card) => (
            <Grid item xs={12} sm={6} md={cards.length > 4 ? 2.4 : 3} key={card.label}>
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
                      {loading ? <Skeleton width={56} /> : card.value}
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
