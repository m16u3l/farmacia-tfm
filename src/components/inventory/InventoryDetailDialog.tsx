import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Chip,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { Inventory } from "@/types";
import { formatDate } from "@/utils/dateUtils";
import {
  isExpired,
  isAboutToExpire,
  isLowStock,
  getDaysUntilExpiry,
  resolveExpiryAlertDays,
  resolveLowStockThreshold,
} from "@/utils/stockAlerts";

interface InventoryDetailDialogProps {
  open: boolean;
  item: Inventory | null;
  /** Umbrales globales de Configuración, para resolver la cascada lote/producto → global. */
  thresholds: { low_stock_threshold: number; expiry_alert_days: number };
  onClose: () => void;
  onEdit: (item: Inventory) => void;
  onTransfer: (item: Inventory) => void;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" component="div">
        {value}
      </Typography>
    </Box>
  );
}

export function InventoryDetailDialog({
  open,
  item,
  thresholds,
  onClose,
  onEdit,
  onTransfer,
}: InventoryDetailDialogProps) {
  const fullScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));

  if (!item) return null;

  const alertDays = resolveExpiryAlertDays(item.expiry_alert_days, thresholds.expiry_alert_days);
  const lowStockThreshold = resolveLowStockThreshold(
    item.product_low_stock_threshold,
    thresholds.low_stock_threshold
  );
  const daysLeft = getDaysUntilExpiry(item.expiry_date);
  const expired = isExpired(item.expiry_date);
  const aboutToExpire = isAboutToExpire(item.expiry_date, alertDays);
  const lowStock = item.quantity_available > 0 && isLowStock(item.quantity_available, lowStockThreshold);

  return (
    <Dialog fullScreen={fullScreen} open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{item.product_name || `Producto #${item.product_id}`}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            <Field label="Lote" value={item.batch_number || "Sin lote"} />
            <Field
              label="Vencimiento"
              value={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                  <span>{item.expiry_date ? formatDate(item.expiry_date) : "Sin fecha"}</span>
                  {expired && <Chip size="small" color="error" label="VENCIDO" />}
                  {!expired && aboutToExpire && (
                    <Chip size="small" color="warning" label={`Vence en ${daysLeft} día(s)`} />
                  )}
                  {item.expiry_is_approximate && (
                    <Chip size="small" variant="outlined" label="Fecha aprox." />
                  )}
                </Box>
              }
            />
            <Field
              label="Cantidad disponible"
              value={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <span>{item.quantity_available}</span>
                  {lowStock && <Chip size="small" color="warning" label="Bajo stock" />}
                  {item.quantity_available === 0 && (
                    <Chip size="small" variant="outlined" label="Agotado" />
                  )}
                </Box>
              }
            />
          </Box>

          <Field label="Ubicación" value={item.area_full_path || item.area_name || "Sin asignar"} />

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            <Field label="Principio activo" value={item.product_active_ingredient || "No especificado"} />
            <Field label="Concentración" value={item.product_concentration || "No especificada"} />
            <Field label="Laboratorio" value={item.product_laboratory || "No especificado"} />
            <Field label="Categoría" value={item.product_category || "No especificada"} />
            <Field label="Código de barras" value={item.product_barcode || "Sin código"} />
          </Box>

          <Field label="Descripción" value={item.product_description || "Sin descripción"} />
          <Field label="Posibles usos" value={item.product_possible_uses || "Sin información"} />

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            <Field label="Precio de compra" value={`$${item.purchase_price || 0}`} />
            <Field label="Precio de venta" value={`$${item.sale_price || 0}`} />
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
        <Button onClick={() => onTransfer(item)}>Transferir</Button>
        <Button variant="contained" onClick={() => onEdit(item)}>
          Editar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
