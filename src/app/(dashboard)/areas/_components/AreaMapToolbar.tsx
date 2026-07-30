"use client";

import { Box, Button, Chip, FormControlLabel, Switch, Typography } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import UndoIcon from "@mui/icons-material/Undo";
import AddIcon from "@mui/icons-material/Add";
import { AreaCoverageStatus } from "@/types";
import { COVERAGE_STATUS_LABELS } from "@/utils/validationLabels";

const LEGEND_ORDER: AreaCoverageStatus[] = ["validated", "due_soon", "overdue", "never", "no_stock"];

interface AreaMapToolbarProps {
  editable: boolean;
  dirty: boolean;
  saving: boolean;
  count: number;
  onToggleEdit: (editable: boolean) => void;
  onSave: () => void;
  onDiscard: () => void;
  onAdd: () => void;
}

export function AreaMapToolbar({
  editable,
  dirty,
  saving,
  count,
  onToggleEdit,
  onSave,
  onDiscard,
  onAdd,
}: AreaMapToolbarProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 1 }}>
      <FormControlLabel
        control={
          <Switch
            checked={editable}
            onChange={(event) => onToggleEdit(event.target.checked)}
            size="small"
          />
        }
        label="Editar mapa"
      />

      <Typography variant="body2" color="text.secondary">
        {count} área{count === 1 ? "" : "s"} en este nivel
      </Typography>

      <Box sx={{ flex: 1 }} />

      {editable && (
        <>
          <Button size="small" startIcon={<AddIcon />} onClick={onAdd}>
            Agregar área aquí
          </Button>
          <Button size="small" startIcon={<UndoIcon />} onClick={onDiscard} disabled={!dirty || saving}>
            Descartar
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={onSave}
            disabled={!dirty || saving}
          >
            Guardar cambios
          </Button>
        </>
      )}

      {!editable && (
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
          {LEGEND_ORDER.map((status) => (
            <Chip
              key={status}
              label={COVERAGE_STATUS_LABELS[status].label}
              color={COVERAGE_STATUS_LABELS[status].color}
              size="small"
              variant="outlined"
              sx={{ height: 22, fontSize: 11 }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
