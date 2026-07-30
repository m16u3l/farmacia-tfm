"use client";

import { Box, Breadcrumbs, Button, Link, Typography } from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import WarehouseOutlinedIcon from "@mui/icons-material/WarehouseOutlined";
import { InventoryArea } from "@/types";

interface AreaMapBreadcrumbProps {
  /** Ruta desde la raíz hasta el nivel actual (vacía en la raíz). */
  path: InventoryArea[];
  onNavigate: (parentId: number | null) => void;
}

/**
 * Navegación entre niveles del mapa. Cada eslabón lleva `data-drop-parent`
 * porque también es zona de destino: soltar una tarjeta sobre un ancestro la
 * saca del nivel actual.
 */
export function AreaMapBreadcrumb({ path, onNavigate }: AreaMapBreadcrumbProps) {
  const parentOfCurrent = path.length > 1 ? path[path.length - 2].area_id : null;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", minHeight: 36 }}>
      {path.length > 0 && (
        <Button
          size="small"
          startIcon={<ArrowUpwardIcon />}
          onClick={() => onNavigate(parentOfCurrent)}
        >
          Subir un nivel
        </Button>
      )}
      <Breadcrumbs separator="›" sx={{ fontSize: 14 }}>
        <Link
          component="button"
          type="button"
          underline={path.length === 0 ? "none" : "hover"}
          color={path.length === 0 ? "text.primary" : "inherit"}
          data-drop-parent="root"
          onClick={() => onNavigate(null)}
          sx={{ display: "flex", alignItems: "center", gap: 0.5, fontSize: 14 }}
        >
          <WarehouseOutlinedIcon fontSize="small" />
          Todo el almacén
        </Link>
        {path.map((area, index) =>
          index === path.length - 1 ? (
            <Typography key={area.area_id} color="text.primary" sx={{ fontSize: 14, fontWeight: 600 }}>
              {area.name}
            </Typography>
          ) : (
            <Link
              key={area.area_id}
              component="button"
              type="button"
              underline="hover"
              color="inherit"
              data-drop-parent={area.area_id}
              onClick={() => onNavigate(area.area_id)}
              sx={{ fontSize: 14 }}
            >
              {area.name}
            </Link>
          )
        )}
      </Breadcrumbs>
    </Box>
  );
}
