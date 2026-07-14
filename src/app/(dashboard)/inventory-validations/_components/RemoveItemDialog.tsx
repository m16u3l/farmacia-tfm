"use client";
import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import LocationOffIcon from "@mui/icons-material/LocationOff";
import {
  DISCREPANCY_REASONS,
  DISCREPANCY_REASON_LABELS,
  DiscrepancyReason,
  InventoryArea,
  InventoryValidationItem,
  RemoveValidationItemInput,
} from "@/types";
import { buildAreaOptions } from "@/utils/areaTree";

interface RemoveItemDialogProps {
  open: boolean;
  item: InventoryValidationItem | null;
  areas: InventoryArea[];
  // Área que se está validando (se excluye del selector de destino).
  currentAreaId?: number | null;
  onClose: () => void;
  onSubmit: (data: RemoveValidationItemInput) => void;
}

export function RemoveItemDialog({ open, item, areas, currentAreaId, onClose, onSubmit }: RemoveItemDialogProps) {
  const fullScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));
  const [outcome, setOutcome] = useState<"moved" | "gone">("moved");
  const [destinationAreaId, setDestinationAreaId] = useState<number | "">("");
  const [discrepancyReason, setDiscrepancyReason] = useState<DiscrepancyReason | "">("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (item) {
      setOutcome("moved");
      setDestinationAreaId("");
      setDiscrepancyReason("");
      setNotes("");
    }
  }, [item]);

  if (!item) return null;

  const canSubmit = outcome === "gone" || destinationAreaId !== "";

  const handleSubmit = () => {
    if (outcome === "moved") {
      if (destinationAreaId === "") return;
      onSubmit({ outcome: "moved", destination_area_id: destinationAreaId, notes: notes || undefined });
    } else {
      onSubmit({ outcome: "gone", discrepancy_reason: discrepancyReason || null, notes: notes || undefined });
    }
  };

  return (
    <Dialog fullScreen={fullScreen} open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Producto no está en esta área</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            {item.product_name || "N/A"}
          </Typography>
          <Typography variant="body2" gutterBottom sx={{ mb: 2 }}>
            <strong>Lote:</strong> {item.batch_number || "N/A"} —{" "}
            <strong>Cantidad en Sistema:</strong> {item.expected_quantity}
          </Typography>

          <Typography variant="body2" sx={{ mb: 1 }}>
            ¿Qué pasó con este producto?
          </Typography>
          <RadioGroup value={outcome} onChange={(e) => setOutcome(e.target.value as "moved" | "gone")}>
            <FormControlLabel value="moved" control={<Radio />} label="Se movió a otra área" />
            <FormControlLabel value="gone" control={<Radio />} label="Ya no existe en el inventario" />
          </RadioGroup>

          {outcome === "moved" && (
            <>
              <TextField
                select
                fullWidth
                label="Área a la que se movió"
                value={destinationAreaId}
                onChange={(e) => setDestinationAreaId(e.target.value ? Number(e.target.value) : "")}
                margin="normal"
                helperText="El lote se reubicará a esa área y quedará registrado el movimiento"
              >
                {/* Se filtra solo el área validada (no su subtree — mover a una
                    sub-área sigue siendo "otra área"). */}
                {buildAreaOptions(areas)
                  .filter(({ area }) => area.area_id !== currentAreaId)
                  .map(({ area, depth, label }) => (
                    <MenuItem key={area.area_id} value={area.area_id} sx={{ pl: 2 + depth * 2 }}>
                      {label}
                    </MenuItem>
                  ))}
              </TextField>
              {destinationAreaId !== "" && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  El lote se moverá de inmediato con sus {item.expected_quantity} unidades. Si el área destino
                  también se valida, se contará allí.
                </Alert>
              )}
            </>
          )}

          {outcome === "gone" && (
            <>
              <Alert severity="warning" sx={{ mt: 1 }}>
                El ítem quedará como &quot;No encontrado&quot;. El stock del lote se llevará a 0 recién al
                aplicar los ajustes al finalizar la validación.
              </Alert>
              <TextField
                select
                fullWidth
                label="Motivo (opcional)"
                value={discrepancyReason}
                onChange={(e) => setDiscrepancyReason(e.target.value as DiscrepancyReason)}
                margin="normal"
                helperText="Ayuda a auditar por causa (vencido, dañado, merma, error de conteo)"
              >
                {DISCREPANCY_REASONS.map((reason) => (
                  <MenuItem key={reason} value={reason}>
                    {DISCREPANCY_REASON_LABELS[reason]}
                  </MenuItem>
                ))}
              </TextField>
            </>
          )}

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Notas"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            margin="normal"
            placeholder="Observaciones adicionales (opcional)"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleSubmit}
          startIcon={<LocationOffIcon />}
          disabled={!canSubmit}
        >
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
