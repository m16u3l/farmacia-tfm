import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { useState, useEffect } from "react";
import { PendingClosureSummary } from "@/types";

interface CloseCashRegisterDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { counted_cash: number; notes?: string }) => Promise<void>;
  getPendingSummary: () => Promise<PendingClosureSummary>;
}

export function CloseCashRegisterDialog({
  open,
  onClose,
  onConfirm,
  getPendingSummary,
}: CloseCashRegisterDialogProps) {
  const [summary, setSummary] = useState<PendingClosureSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [countedCash, setCountedCash] = useState("");
  const [notes, setNotes] = useState("");
  const [qrConfirmed, setQrConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSummary(null);
    setCountedCash("");
    setNotes("");
    setQrConfirmed(false);
    setError(null);
    setLoadingSummary(true);
    getPendingSummary()
      .then(setSummary)
      .catch(() => setError("Error al obtener las ventas pendientes de cierre"))
      .finally(() => setLoadingSummary(false));
  }, [open, getPendingSummary]);

  const totalEfectivo = summary ? Number(summary.total_efectivo) : 0;
  const totalQr = summary ? Number(summary.total_qr_transferencia) : 0;
  const parsedCountedCash = parseFloat(countedCash);
  const difference = !Number.isNaN(parsedCountedCash) ? parsedCountedCash - totalEfectivo : null;

  const handleSubmit = async () => {
    if (Number.isNaN(parsedCountedCash) || parsedCountedCash < 0) {
      setError("Ingrese el efectivo contado");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm({ counted_cash: parsedCountedCash, notes: notes || undefined });
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Cerrar caja</DialogTitle>
      <DialogContent>
        {loadingSummary && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {!loadingSummary && summary && summary.sell_count === 0 && (
          <Alert severity="info" sx={{ mt: 1 }}>
            No hay ventas pendientes de cierre.
          </Alert>
        )}

        {!loadingSummary && summary && summary.sell_count > 0 && (
          <>
            <Alert severity="warning" sx={{ mt: 1, mb: 2 }}>
              Se incluirán todas las ventas registradas desde tu último cierre de caja.
              Una vez confirmado, las ventas quedarán bloqueadas y el cierre{" "}
              <strong>no se podrá editar</strong>.
            </Alert>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mb: 2 }}>
              <Typography variant="body2">
                Ventas a incluir: <strong>{summary.sell_count}</strong>
              </Typography>
              <Typography variant="body2">
                Total: <strong>${Number(summary.total_amount).toFixed(2)}</strong>
              </Typography>
              <Typography variant="body2">
                Efectivo: <strong>${totalEfectivo.toFixed(2)}</strong>
              </Typography>
              <Typography variant="body2">
                QR/Transferencia: <strong>${Number(summary.total_qr_transferencia).toFixed(2)}</strong>
              </Typography>
            </Box>

            <TextField
              label="Efectivo contado"
              type="number"
              value={countedCash}
              onChange={(e) => setCountedCash(e.target.value)}
              fullWidth
              required
              inputProps={{ step: "0.01", min: "0" }}
              sx={{ mb: 2 }}
            />

            {difference !== null && (
              <Alert
                severity={difference === 0 ? "success" : difference > 0 ? "info" : "error"}
                sx={{ mb: 2 }}
              >
                {difference === 0
                  ? "El efectivo contado coincide con lo esperado."
                  : difference > 0
                  ? `Sobrante: $${difference.toFixed(2)}`
                  : `Faltante: $${Math.abs(difference).toFixed(2)}`}
              </Alert>
            )}

            {totalQr > 0 && (
              <FormControlLabel
                sx={{ mb: 2, alignItems: "flex-start", "& .MuiCheckbox-root": { pt: 0 } }}
                control={
                  <Checkbox
                    checked={qrConfirmed}
                    onChange={(e) => setQrConfirmed(e.target.checked)}
                  />
                }
                label={
                  <Typography variant="body2">
                    Se registraron pagos por QR/transferencia por{" "}
                    <strong>${totalQr.toFixed(2)}</strong>. Confirmo que revisé que ese
                    monto llegó a la cuenta.
                  </Typography>
                }
              />
            )}

            <TextField
              label="Notas (opcional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
          </>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={
            submitting ||
            !summary ||
            summary.sell_count === 0 ||
            (totalQr > 0 && !qrConfirmed)
          }
        >
          Confirmar cierre
        </Button>
      </DialogActions>
    </Dialog>
  );
}
