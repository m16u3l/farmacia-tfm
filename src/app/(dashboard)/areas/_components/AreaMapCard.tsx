"use client";

import { Box, Chip, IconButton, Tooltip, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DriveFileMoveOutlinedIcon from "@mui/icons-material/DriveFileMoveOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import { AreaCoverage, InventoryArea } from "@/types";
import { COVERAGE_STATUS_LABELS } from "@/utils/validationLabels";
import { AreaMiniMap } from "./AreaMiniMap";

/** Nombre del área que agrupa los lotes sin ubicación (migración 021). */
export const UNCLASSIFIED_AREA_NAME = "Por clasificar";

interface AreaMapCardProps {
  area: InventoryArea;
  areas: InventoryArea[];
  coverage?: AreaCoverage;
  coverageByArea: Map<number, AreaCoverage>;
  childCount: number;
  editable: boolean;
  /** En móvil la tarjeta entera es un botón y las acciones van en el panel inferior. */
  compact: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMove: () => void;
  onSelect: () => void;
}

export function AreaMapCard({
  area,
  areas,
  coverage,
  coverageByArea,
  childCount,
  editable,
  compact,
  onOpen,
  onEdit,
  onDelete,
  onMove,
  onSelect,
}: AreaMapCardProps) {
  const theme = useTheme();
  const status = coverage?.status;
  const statusInfo = status ? COVERAGE_STATUS_LABELS[status] : null;
  const isUnclassified = area.name === UNCLASSIFIED_AREA_NAME && !area.parent_area_id;
  const accent = isUnclassified ? theme.palette.secondary.main : theme.palette.primary.main;

  return (
    <Box
      // El hit-test del reparentado busca estos atributos al soltar.
      data-area-id={area.area_id}
      data-area-level="current"
      onClick={compact ? onSelect : undefined}
      onDoubleClick={!compact && !editable && childCount > 0 ? onOpen : undefined}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        p: 1,
        borderRadius: 2,
        border: "1px solid",
        borderStyle: isUnclassified ? "dashed" : "solid",
        borderColor: alpha(accent, 0.35),
        bgcolor: "background.paper",
        opacity: area.is_active ? 1 : 0.55,
        overflow: "hidden",
        cursor: compact ? "pointer" : editable ? "default" : "pointer",
        transition: "border-color 120ms ease, box-shadow 120ms ease",
        "&:hover": { borderColor: accent, boxShadow: 1 },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5, minWidth: 0 }}>
        {editable && (
          <Box
            className="area-card-handle"
            sx={{
              display: "flex",
              alignItems: "center",
              color: "text.disabled",
              cursor: "grab",
              "&:active": { cursor: "grabbing" },
            }}
          >
            <DragIndicatorIcon fontSize="small" />
          </Box>
        )}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography noWrap sx={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>
            {area.name}
          </Typography>
          <Typography noWrap sx={{ fontSize: 11, color: "text.secondary" }}>
            {area.type}
            {childCount > 0 && ` · ${childCount} sub-área${childCount === 1 ? "" : "s"}`}
          </Typography>
        </Box>
        {!compact && (
          <Box className="area-card-actions" sx={{ display: "flex", flexShrink: 0 }}>
            {childCount > 0 && (
              <Tooltip title="Abrir">
                <IconButton size="small" onClick={onOpen} aria-label={`Abrir ${area.name}`}>
                  <ArrowForwardIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {editable && (
              <Tooltip title="Mover a otra área">
                <IconButton size="small" onClick={onMove} aria-label={`Mover ${area.name}`}>
                  <DriveFileMoveOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {!editable && (
              <>
                <Tooltip title="Editar">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={onEdit}
                    aria-label={`Editar ${area.name}`}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={onDelete}
                    aria-label={`Eliminar ${area.name}`}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        )}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap", mt: 0.5 }}>
        {statusInfo && (
          <Chip
            label={statusInfo.label}
            color={statusInfo.color}
            size="small"
            sx={{ height: 18, fontSize: 10 }}
          />
        )}
        {!area.is_active && (
          <Chip label="Inactiva" size="small" variant="outlined" sx={{ height: 18, fontSize: 10 }} />
        )}
        {coverage && coverage.active_lots > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, color: "text.secondary" }}>
            <Inventory2OutlinedIcon sx={{ fontSize: 13 }} />
            <Typography sx={{ fontSize: 11 }}>{coverage.active_lots}</Typography>
          </Box>
        )}
      </Box>

      <AreaMiniMap areas={areas} parentAreaId={area.area_id} coverageByArea={coverageByArea} />
    </Box>
  );
}
