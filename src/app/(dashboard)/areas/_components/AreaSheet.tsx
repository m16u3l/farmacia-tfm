"use client";

import {
  Box,
  Chip,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import DriveFileMoveOutlinedIcon from "@mui/icons-material/DriveFileMoveOutlined";
import { AreaCoverage, InventoryArea } from "@/types";
import { COVERAGE_STATUS_LABELS } from "@/utils/validationLabels";

interface AreaSheetProps {
  area: InventoryArea | null;
  /** Ruta de ancestros ("Almacén › Estante"), sin el nombre del área misma. */
  pathLabel: string;
  coverage?: AreaCoverage;
  childCount: number;
  onClose: () => void;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMove: () => void;
}

/** Acciones de un área en móvil, donde la tarjeta del mapa es solo lectura. */
export function AreaSheet({
  area,
  pathLabel,
  coverage,
  childCount,
  onClose,
  onOpen,
  onEdit,
  onDelete,
  onMove,
}: AreaSheetProps) {
  const statusInfo = coverage ? COVERAGE_STATUS_LABELS[coverage.status] : null;

  return (
    <Drawer
      anchor="bottom"
      open={!!area}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            pb: "env(safe-area-inset-bottom)",
            maxHeight: "70dvh",
          },
        },
      }}
    >
      {area && (
        <Box>
          <Box sx={{ display: "flex", justifyContent: "center", pt: 1 }}>
            <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: "divider" }} />
          </Box>

          <Box sx={{ p: 2, pb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {area.name}
            </Typography>
            {pathLabel && (
              <Typography variant="body2" color="text.secondary">
                {pathLabel}
              </Typography>
            )}
            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 1 }}>
              <Chip label={area.type} size="small" variant="outlined" />
              {statusInfo && <Chip label={statusInfo.label} color={statusInfo.color} size="small" />}
              {!area.is_active && <Chip label="Inactiva" size="small" />}
            </Box>
            {coverage && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {coverage.active_lots} lote{coverage.active_lots === 1 ? "" : "s"} con existencias
                {coverage.days_remaining !== null &&
                  ` · ${
                    coverage.days_remaining > 0
                      ? `${coverage.days_remaining} días de vigencia`
                      : "validación vencida"
                  }`}
              </Typography>
            )}
          </Box>

          <Divider />

          <List>
            {childCount > 0 && (
              <ListItemButton onClick={onOpen} sx={{ minHeight: 48 }}>
                <ListItemIcon>
                  <ArrowForwardIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Abrir"
                  secondary={`Ver sus ${childCount} sub-área${childCount === 1 ? "" : "s"}`}
                />
              </ListItemButton>
            )}
            <ListItemButton onClick={onMove} sx={{ minHeight: 48 }}>
              <ListItemIcon>
                <DriveFileMoveOutlinedIcon />
              </ListItemIcon>
              <ListItemText primary="Mover a otra área" />
            </ListItemButton>
            <ListItemButton onClick={onEdit} sx={{ minHeight: 48 }}>
              <ListItemIcon>
                <EditIcon />
              </ListItemIcon>
              <ListItemText primary="Editar" />
            </ListItemButton>
            <ListItemButton onClick={onDelete} sx={{ minHeight: 48 }}>
              <ListItemIcon>
                <DeleteIcon color="error" />
              </ListItemIcon>
              <ListItemText primary="Eliminar" primaryTypographyProps={{ color: "error" }} />
            </ListItemButton>
          </List>
        </Box>
      )}
    </Drawer>
  );
}
