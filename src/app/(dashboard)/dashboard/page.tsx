"use client";

import { useEffect, useState } from "react";
import { Box, Paper, Typography, Card, CardActionArea, Skeleton } from "@mui/material";
import StorefrontIcon from "@mui/icons-material/StorefrontOutlined";
import PointOfSaleIcon from "@mui/icons-material/PointOfSaleOutlined";
import LocalMallIcon from "@mui/icons-material/LocalMallOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmberOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import DashboardIcon from "@mui/icons-material/SpaceDashboardOutlined";
import { fluidFontSize } from "@/utils/fluidType";
import { useCurrentUser } from "@/hooks/useCurrentUser";

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
  const { user } = useCurrentUser();

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
      label: "Inventario validado este mes",
      value: `${stats.validationCoverage}%`,
      icon: <FactCheckOutlinedIcon />,
      href: "/inventory-validations",
      color: stats.validationCoverage === 100 ? "#0E7C66" : "#E8720C",
    });
  }

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <PageHeader
          title="Panel de BioFarm"
          subtitle={
            user
              ? `Hola, ${user.first_name} — resumen general de la operación`
              : "Resumen general de la operación de la farmacia"
          }
          icon={<DashboardIcon />}
        />

        <Box
          sx={{
            display: "grid",
            gap: { xs: 1.25, sm: 2 },
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              sm: "repeat(3, minmax(0, 1fr))",
              lg: `repeat(${cards.length}, minmax(0, 1fr))`,
            },
          }}
        >
          {cards.map((card) => (
            <Card key={card.label} variant="outlined" sx={{ height: "100%" }}>
              <CardActionArea
                component={Link}
                href={card.href}
                sx={{
                  height: "100%",
                  p: { xs: 1.5, sm: 2 },
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 0.5,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: { xs: 34, sm: 40 },
                    height: { xs: 34, sm: 40 },
                    borderRadius: 2,
                    bgcolor: `${card.color}1A`,
                    color: card.color,
                    mb: { xs: 0.5, sm: 1 },
                    "& svg": { fontSize: { xs: 20, sm: 24 } },
                  }}
                >
                  {card.icon}
                </Box>
                <Typography
                  variant="h4"
                  sx={{ fontSize: fluidFontSize(1.4, 1.75), lineHeight: 1.1 }}
                >
                  {loading ? <Skeleton width={56} /> : card.value}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" }, lineHeight: 1.3 }}
                >
                  {card.label}
                </Typography>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      </Paper>
    </Box>
  );
}
