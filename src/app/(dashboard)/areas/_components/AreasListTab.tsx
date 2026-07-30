"use client";

import {
  Box,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { InventoryArea } from "@/types";
import { buildAreaOptions } from "@/utils/areaTree";

interface AreasListTabProps {
  areas: InventoryArea[];
  loading: boolean;
  onEdit: (area: InventoryArea) => void;
  onDelete: (id: number) => void;
}

/** Listado jerárquico plano de las áreas. Tabla en escritorio, tarjetas en móvil. */
export function AreasListTab({ areas, loading, onEdit, onDelete }: AreasListTabProps) {
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));
  const treeOptions = buildAreaOptions(areas);

  if (!loading && treeOptions.length === 0) {
    return (
      <Typography color="text.secondary" align="center" sx={{ mt: 2 }}>
        No hay áreas creadas todavía.
      </Typography>
    );
  }

  if (isMobile) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 2 }}>
        {treeOptions.map(({ area, label }) => (
          <Box
            key={area.area_id}
            sx={{
              p: 1.5,
              borderRadius: 1,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
            }}
          >
            <Typography sx={{ fontWeight: 600 }}>{label}</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5, flexWrap: "wrap" }}>
              <Chip label={area.type} size="small" variant="outlined" />
              <Chip
                label={area.is_active ? "Activa" : "Inactiva"}
                color={area.is_active ? "success" : "default"}
                size="small"
              />
            </Box>
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.5 }}>
              <IconButton aria-label="Editar área" size="small" onClick={() => onEdit(area)} color="primary">
                <EditIcon />
              </IconButton>
              <IconButton
                aria-label="Eliminar área"
                size="small"
                onClick={() => onDelete(area.area_id)}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <TableContainer sx={{ mt: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ bgcolor: "primary.light", color: "white", fontWeight: "bold" }}>Nombre</TableCell>
            <TableCell sx={{ bgcolor: "primary.light", color: "white", fontWeight: "bold" }}>Tipo</TableCell>
            <TableCell sx={{ bgcolor: "primary.light", color: "white", fontWeight: "bold" }}>Estado</TableCell>
            <TableCell sx={{ bgcolor: "primary.light", color: "white", fontWeight: "bold" }}>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {treeOptions.map(({ area, label }) => (
            <TableRow key={area.area_id} sx={{ "&:nth-of-type(even)": { bgcolor: "action.hover" } }}>
              <TableCell>{label}</TableCell>
              <TableCell>{area.type}</TableCell>
              <TableCell>
                <Chip
                  label={area.is_active ? "Activa" : "Inactiva"}
                  color={area.is_active ? "success" : "default"}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <IconButton aria-label="Editar área" size="small" onClick={() => onEdit(area)} color="primary">
                  <EditIcon />
                </IconButton>
                <IconButton
                  aria-label="Eliminar área"
                  size="small"
                  onClick={() => onDelete(area.area_id)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
