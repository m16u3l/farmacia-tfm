"use client";

import { Box, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { AreaCoverage, InventoryArea } from "@/types";
import { areasToLayout, childrenOf, levelBounds } from "@/utils/areaMap";
import { COVERAGE_STATUS_LABELS } from "@/utils/validationLabels";

interface AreaMiniMapProps {
  areas: InventoryArea[];
  parentAreaId: number;
  coverageByArea: Map<number, AreaCoverage>;
}

/**
 * Dibuja las sub-áreas dentro de la tarjeta de su padre (los apartados dentro
 * del estante). No usa react-grid-layout: son cajas absolutas en porcentajes
 * sobre las mismas coordenadas, así que no compite por los eventos de arrastre.
 * Solo baja un nivel; los nietos se resumen con un "+N".
 */
export function AreaMiniMap({ areas, parentAreaId, coverageByArea }: AreaMiniMapProps) {
  const theme = useTheme();
  const children = childrenOf(areas, parentAreaId);
  if (children.length === 0) return null;

  const { cols, rows } = levelBounds(areasToLayout(areas, parentAreaId));

  return (
    <Box
      data-area-mini="true"
      sx={{
        position: "relative",
        flex: 1,
        minHeight: 24,
        mt: 0.5,
        borderRadius: 1,
        bgcolor: alpha(theme.palette.primary.main, 0.04),
        // Nunca debe robarle el arrastre a la tarjeta que la contiene.
        pointerEvents: "none",
      }}
    >
      {children.map((child) => {
        const status = coverageByArea.get(child.area_id)?.status;
        const color = status ? COVERAGE_STATUS_LABELS[status].color : "default";
        const paletteColor =
          color === "default" ? theme.palette.grey[500] : theme.palette[color].main;
        const grandChildren = childrenOf(areas, child.area_id).length;

        return (
          <Box
            key={child.area_id}
            sx={{
              position: "absolute",
              left: `${(child.map_x / cols) * 100}%`,
              top: `${(child.map_y / rows) * 100}%`,
              width: `${(child.map_w / cols) * 100}%`,
              height: `${(child.map_h / rows) * 100}%`,
              p: "1px",
            }}
          >
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  minHeight: 10,
                  borderRadius: 0.5,
                  border: "1px dashed",
                  borderColor: alpha(paletteColor, 0.5),
                  bgcolor: alpha(paletteColor, 0.14),
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  px: 0.25,
                }}
              >
                {/* Con celdas chicas el nombre es ilegible; el contenedor lo
                    recorta y queda solo el color de estado. */}
                <Typography
                  noWrap
                  sx={{ fontSize: 9, lineHeight: 1.1, color: "text.secondary", fontWeight: 500 }}
                >
                  {child.name}
                  {grandChildren > 0 && ` +${grandChildren}`}
                </Typography>
              </Box>
            </Box>
        );
      })}
    </Box>
  );
}
