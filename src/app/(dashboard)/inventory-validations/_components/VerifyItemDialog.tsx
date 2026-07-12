"use client";
import { formatDate } from "@/utils/dateUtils";
import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import VerifiedIcon from "@mui/icons-material/Verified";
import { InventoryValidationItem, DiscrepancyReason, DISCREPANCY_REASONS, DISCREPANCY_REASON_LABELS } from "@/types";

interface VerifyItemDialogProps {
  open: boolean;
  item: InventoryValidationItem | null;
  onClose: () => void;
  onSubmit: (data: {
    actual_quantity: number;
    actual_expiry_date: string | null;
    notes: string;
    discrepancy_reason: DiscrepancyReason | null;
  }) => void;
}

const QUANTITY_PATTERN = /^\d+$/;

// "2026-01-27T04:00:00.000Z" -> "2026-01-27", para precargar un <input type="date">.
const toDateInputValue = (date: string | null | undefined): string => {
  if (!date) return "";
  return date.split("T")[0];
};

// Formatea un "YYYY-MM-DD" suelto sin pasar por UTC — new Date("YYYY-MM-DD")
// se interpreta como medianoche UTC, y en zonas horarias detrás de UTC
// (ej. Bolivia, UTC-4) toLocaleDateString() lo muestra un día antes.
const formatDateOnly = (dateOnly: string): string => {
  const [year, month, day] = dateOnly.split("-").map(Number);
  return formatDate(new Date(year, month - 1, day));
};

export function VerifyItemDialog({ open, item, onClose, onSubmit }: VerifyItemDialogProps) {
  const [quantityInput, setQuantityInput] = useState("");
  const [expiryInput, setExpiryInput] = useState("");
  const [notes, setNotes] = useState("");
  const [discrepancyReason, setDiscrepancyReason] = useState<DiscrepancyReason | "">("");

  // Cada vez que se abre para un ítem nuevo, sembrar el borrador con el valor
  // previamente registrado (o la cantidad/fecha esperada si aún no se verificó).
  useEffect(() => {
    if (item) {
      setQuantityInput(String(item.actual_quantity ?? item.expected_quantity));
      setExpiryInput(toDateInputValue(item.actual_expiry_date ?? item.expiry_date));
      setNotes(item.notes || "");
      setDiscrepancyReason(item.discrepancy_reason || "");
    }
  }, [item]);

  if (!item) return null;

  const trimmed = quantityInput.trim();
  // Un campo vacío o con texto no numérico es distinto de "0 explícito" — no se
  // puede coercionar silenciosamente a 0, o una limpieza accidental del campo
  // registraría una falsa "no encontrado".
  const parsedQuantity = QUANTITY_PATTERN.test(trimmed) ? parseInt(trimmed, 10) : null;
  const isInvalid = trimmed.length > 0 && parsedQuantity === null;
  const systemExpiry = toDateInputValue(item.expiry_date);
  const expiryChanged = expiryInput !== "" && expiryInput !== systemExpiry;
  const hasDiscrepancy = parsedQuantity !== null && parsedQuantity !== item.expected_quantity;

  const handleSubmit = () => {
    if (parsedQuantity === null) return;
    onSubmit({
      actual_quantity: parsedQuantity,
      actual_expiry_date: expiryInput || null,
      notes,
      discrepancy_reason: hasDiscrepancy && discrepancyReason ? discrepancyReason : null,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Verificar Item de Inventario</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            {item.product_name || "N/A"}
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>Lote:</strong> {item.batch_number || "N/A"}
          </Typography>
          <Typography variant="body2" gutterBottom sx={{ mb: 2 }}>
            <strong>Cantidad en Sistema:</strong> {item.expected_quantity}
          </Typography>

          <TextField
            fullWidth
            type="number"
            label="Cantidad Real Contada"
            value={quantityInput}
            onChange={(e) => setQuantityInput(e.target.value)}
            margin="normal"
            inputProps={{ min: 0 }}
            error={isInvalid}
            helperText={
              isInvalid
                ? "Ingresa un número entero ≥ 0"
                : "Ingrese la cantidad física contada"
            }
          />

          {hasDiscrepancy && (
            <>
              <Alert severity={parsedQuantity! < item.expected_quantity ? "warning" : "info"} sx={{ mt: 2 }}>
                Diferencia: {parsedQuantity! - item.expected_quantity} unidades
                {parsedQuantity! < item.expected_quantity ? " (Faltante)" : " (Sobrante)"}
              </Alert>
              <TextField
                select
                fullWidth
                label="Motivo de la diferencia"
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
            type="date"
            label="Fecha de Vencimiento Real"
            value={expiryInput}
            onChange={(e) => setExpiryInput(e.target.value)}
            margin="normal"
            InputLabelProps={{ shrink: true }}
            helperText={
              systemExpiry
                ? `En sistema: ${formatDateOnly(systemExpiry)}. Corrígela solo si el lote físico muestra otra fecha.`
                : "El lote no tiene fecha de vencimiento registrada en el sistema."
            }
          />

          {expiryChanged && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Fecha corregida: {formatDateOnly(expiryInput)} (en sistema:{" "}
              {systemExpiry ? formatDateOnly(systemExpiry) : "sin fecha"})
            </Alert>
          )}

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notas de Verificación"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            margin="normal"
            placeholder="Observaciones, razón de diferencias, etc."
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          startIcon={<VerifiedIcon />}
          disabled={parsedQuantity === null}
        >
          Marcar como Verificado
        </Button>
      </DialogActions>
    </Dialog>
  );
}
