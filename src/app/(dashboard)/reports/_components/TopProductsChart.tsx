"use client";

import { Box, Typography } from "@mui/material";
import { fluidFontSize } from "@/utils/fluidType";

export interface ChartBar {
  id: number;
  label: string;
  value: number;
  display: string;
}

interface TopProductsChartProps {
  bars: ChartBar[];
}

/**
 * Barras horizontales del top de productos. Hecho con Box en vez de una
 * librería de gráficos porque el proyecto no tiene ninguna instalada y este es
 * el único gráfico de la app.
 */
export function TopProductsChart({ bars }: TopProductsChartProps) {
  if (bars.length === 0) return null;

  const max = Math.max(...bars.map((b) => b.value));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {bars.map((bar) => (
        <Box key={bar.id}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: 1,
              mb: 0.5,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontSize: fluidFontSize(0.75, 0.875),
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {bar.label}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: fluidFontSize(0.75, 0.875),
                fontWeight: "bold",
                color: "primary.main",
                flexShrink: 0,
              }}
            >
              {bar.display}
            </Typography>
          </Box>
          <Box
            sx={{
              height: 10,
              width: "100%",
              bgcolor: "action.hover",
              borderRadius: 5,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                height: "100%",
                // max > 0 siempre que haya barras con valor; si todas son 0 la
                // barra queda vacía en vez de dividir por cero.
                width: max > 0 ? `${(bar.value / max) * 100}%` : "0%",
                bgcolor: "primary.main",
                borderRadius: 5,
                transition: "width .3s",
              }}
            />
          </Box>
        </Box>
      ))}
    </Box>
  );
}
