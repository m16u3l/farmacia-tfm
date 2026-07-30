"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { InventoryArea } from "@/types";
import { buildAreaOptions } from "@/utils/areaTree";
import { isDescendant, MAX_MAP_DEPTH, pathTo } from "@/utils/areaMap";

interface MoveAreaDialogProps {
  area: InventoryArea | null;
  areas: InventoryArea[];
  onClose: () => void;
  onConfirm: (parentAreaId: number | null) => void;
}

/**
 * Alternativa al arrastrar-y-soltar para reasignar el área padre: en móvil no
 * se puede arrastrar, y con teclado tampoco.
 */
export function MoveAreaDialog({ area, areas, onClose, onConfirm }: MoveAreaDialogProps) {
  const fullScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));
  const [parentId, setParentId] = useState<string>("");

  useEffect(() => {
    setParentId(area?.parent_area_id ? String(area.parent_area_id) : "");
  }, [area]);

  if (!area) return null;

  // Se excluyen el área misma, todo su subárbol (sería un ciclo) y los destinos
  // que dejarían la jerarquía más profunda de lo permitido.
  const options = buildAreaOptions(areas, area.area_id).filter(
    ({ area: candidate }) =>
      !isDescendant(areas, candidate.area_id, area.area_id) &&
      pathTo(areas, candidate.area_id).length < MAX_MAP_DEPTH
  );

  return (
    <Dialog open fullScreen={fullScreen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Mover «{area.name}»</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Elige el área que la contendrá. Sus sub-áreas se mueven con ella.
        </Typography>
        <TextField
          select
          fullWidth
          label="Área destino"
          value={parentId}
          onChange={(event) => setParentId(event.target.value)}
        >
          <MenuItem value="">
            <em>Sin área padre (nivel principal)</em>
          </MenuItem>
          {options.map(({ area: candidate, depth }) => (
            <MenuItem key={candidate.area_id} value={String(candidate.area_id)} sx={{ pl: 2 + depth * 2 }}>
              {candidate.name}
            </MenuItem>
          ))}
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={() => onConfirm(parentId ? Number(parentId) : null)}>
          Mover
        </Button>
      </DialogActions>
    </Dialog>
  );
}
