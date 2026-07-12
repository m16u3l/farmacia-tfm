import { formatDate } from "@/utils/dateUtils";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Box,
  Typography,
  Autocomplete,
  createFilterOptions,
  Alert,
  Chip,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { SellFormData, SellItem, PaymentMethod, PAYMENT_METHOD_LABELS, Inventory } from "@/types";
import { SALE_CONTROL_LABELS } from "@/types/products";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import CloseIcon from "@mui/icons-material/Close";
import { useState, useEffect, useMemo } from "react";

// Normaliza para comparar nombres sin distinguir may/min ni acentos
const normalizeName = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

// Distancia de edición simple, usada para detectar nombres parecidos (LASA:
// look-alike/sound-alike) que pueden confundirse en el mostrador.
const levenshtein = (a: string, b: string) => {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
};

const getStockColor = (qty: number): "error" | "warning" | "success" => {
  if (qty <= 0) return "error";
  if (qty <= 5) return "warning";
  return "success";
};

// Los montos pueden llegar como string desde el API (numeric de Postgres).
const formatMoney = (value: number | string) => `$${(Number(value) || 0).toFixed(2)}`;

const filterInventoryOptions = createFilterOptions<Inventory>({
  stringify: (option) =>
    [option.product_name, option.product_barcode, option.product_active_ingredient, option.product_laboratory]
      .filter(Boolean)
      .join(" "),
});

interface SellFormProps {
  open: boolean;
  isEditing: boolean;
  formData: SellFormData;
  onClose: () => void;
  onSubmit: (data: SellFormData) => void | Promise<void>;
  onChange: (field: keyof SellFormData, value: unknown) => void;
}

export function SellForm({
  open,
  isEditing,
  formData,
  onClose,
  onSubmit,
  onChange,
}: SellFormProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
  const [stockMsg, setStockMsg] = useState<string | null>(null);
  const [received, setReceived] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const inventoryResponse = await fetch('/api/inventory');
        const inventoryData = await inventoryResponse.json();
        setInventory(inventoryData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    if (open) {
      fetchInventory();
    }
  }, [open]);

  // Limpia el estado local de la venta anterior cada vez que se abre el diálogo.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setSelectedInventory(null);
      setStockMsg(null);
      setReceived("");
    }
  }

  const items = useMemo(() => formData.items ?? [], [formData.items]);
  const total = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0),
    [items]
  );
  const receivedAmount = parseFloat(received);
  const change = Number.isNaN(receivedAmount) ? null : receivedAmount - total;

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };

  // Evita perder un carrito armado por un toque accidental fuera del diálogo;
  // cerrar sigue disponible vía la X y "Cancelar".
  const handleDialogClose = (_: object, reason: "backdropClick" | "escapeKeyDown") => {
    if (items.length > 0 && (reason === "backdropClick" || reason === "escapeKeyDown")) return;
    onClose();
  };

  const addItem = () => {
    if (!selectedInventory) return;
    const next = [...items];
    const existingIndex = next.findIndex(
      (item) => item.inventory_id === selectedInventory.inventory_id
    );
    if (existingIndex >= 0) {
      const existing = next[existingIndex];
      const quantity = Number(existing.quantity) + 1;
      if (quantity > selectedInventory.quantity_available) {
        setStockMsg(
          `Ya agregaste todo el stock disponible de este lote (${selectedInventory.quantity_available}).`
        );
        return;
      }
      next[existingIndex] = {
        ...existing,
        quantity,
        subtotal: quantity * (Number(existing.unit_price) || 0),
      };
    } else {
      const unit_price = Number(selectedInventory.sale_price) || 0;
      next.push({
        sell_item_id: 0,
        sell_id: 0,
        inventory_id: selectedInventory.inventory_id,
        quantity: 1,
        unit_price,
        subtotal: unit_price,
        inventory: selectedInventory,
      });
    }
    onChange("items", next);
    setStockMsg(null);
    setSelectedInventory(null);
  };

  const updateItem = (
    index: number,
    patch: Partial<Pick<SellItem, "quantity" | "unit_price">>
  ) => {
    const next = items.map((item, i) => {
      if (i !== index) return item;
      const quantity = patch.quantity ?? Number(item.quantity);
      const unit_price = patch.unit_price ?? (Number(item.unit_price) || 0);
      return { ...item, quantity, unit_price, subtotal: quantity * unit_price };
    });
    onChange("items", next);
  };

  const removeItem = (index: number) => {
    onChange(
      "items",
      items.filter((_, i) => i !== index)
    );
  };

  // FEFO (first-expired, first-out): dentro de un mismo producto, ordena los
  // lotes por vencimiento más próximo primero — sugerencia, no bloqueo.
  const sortedInventory = useMemo(() => {
    return [...inventory].sort((a, b) => {
      const nameCompare = (a.product_name || "").localeCompare(b.product_name || "");
      if (nameCompare !== 0) return nameCompare;
      if (!a.expiry_date && !b.expiry_date) return 0;
      if (!a.expiry_date) return 1;
      if (!b.expiry_date) return -1;
      return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
    });
  }, [inventory]);

  // Lote con vencimiento más próximo por producto (entre los que tienen fecha).
  const earliestExpiryByProduct = useMemo(() => {
    const map = new Map<number, Inventory>();
    for (const item of inventory) {
      if (!item.expiry_date) continue;
      const current = map.get(item.product_id);
      if (!current || new Date(item.expiry_date).getTime() < new Date(current.expiry_date!).getTime()) {
        map.set(item.product_id, item);
      }
    }
    return map;
  }, [inventory]);

  const lotCountByProduct = useMemo(() => {
    const counts = new Map<number, number>();
    for (const item of inventory) {
      counts.set(item.product_id, (counts.get(item.product_id) ?? 0) + 1);
    }
    return counts;
  }, [inventory]);

  const isFefoRecommended = (option: Inventory) =>
    (lotCountByProduct.get(option.product_id) ?? 0) > 1 &&
    earliestExpiryByProduct.get(option.product_id)?.inventory_id === option.inventory_id;

  const earlierLotForSelected =
    selectedInventory &&
    earliestExpiryByProduct.get(selectedInventory.product_id)?.inventory_id !== selectedInventory.inventory_id
      ? earliestExpiryByProduct.get(selectedInventory.product_id)
      : null;

  // Otros productos con nombre parecido al seleccionado (posible confusión LASA)
  const similarNameWarnings = useMemo(() => {
    if (!selectedInventory?.product_name) return [];
    const selectedName = normalizeName(selectedInventory.product_name);
    const seen = new Set<string>();
    return inventory.filter((item) => {
      if (
        item.inventory_id === selectedInventory.inventory_id ||
        item.product_id === selectedInventory.product_id ||
        !item.product_name
      ) {
        return false;
      }
      const name = normalizeName(item.product_name);
      if (seen.has(name)) return false;
      const distance = levenshtein(selectedName, name);
      const isSimilar = name !== selectedName && distance > 0 && distance <= 2;
      if (isSimilar) seen.add(name);
      return isSimilar;
    });
  }, [selectedInventory, inventory]);

  const PAYMENT_METHODS: PaymentMethod[] = ["efectivo", "qr_transferencia"];

  return (
    <Dialog open={open} onClose={handleDialogClose} maxWidth="md" fullWidth fullScreen={fullScreen}>
      <DialogTitle
        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1 }}
      >
        {isEditing ? "Editar venta" : "Nueva venta"}
        <IconButton aria-label="Cerrar" onClick={onClose} edge="end">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box
          sx={{
            display: "flex",
            gap: 1,
            alignItems: "flex-start",
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <Autocomplete
            options={sortedInventory}
            filterOptions={filterInventoryOptions}
            getOptionLabel={(option) =>
              [option.product_name || "Producto", option.product_laboratory, option.product_concentration]
                .filter(Boolean)
                .join(" - ")
            }
            getOptionKey={(option) => option.inventory_id}
            getOptionDisabled={(option) => option.quantity_available <= 0}
            renderOption={(props, option) => {
              const outOfStock = option.quantity_available <= 0;
              return (
                <Box component="li" {...props} key={option.inventory_id}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2">{option.product_name || "Producto"}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                        {[option.product_laboratory, option.product_active_ingredient, option.product_concentration]
                          .filter(Boolean)
                          .join(" · ") || "Sin datos de laboratorio/principio activo"}
                        {option.expiry_date && ` — Vence: ${formatDate(option.expiry_date)}`}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.25 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 600,
                            color: (theme) => theme.palette[getStockColor(option.quantity_available)].main,
                          }}
                        >
                          {outOfStock ? "Sin stock" : `Stock: ${option.quantity_available}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          · {option.area_name || "Sin ubicación"}
                        </Typography>
                      </Box>
                    </Box>
                    {isFefoRecommended(option) && (
                      <Chip size="small" label="Vence primero" color="success" variant="outlined" />
                    )}
                    {option.product_sale_control && option.product_sale_control !== "libre" && (
                      <Chip
                        size="small"
                        label={SALE_CONTROL_LABELS[option.product_sale_control]}
                        color={option.product_sale_control === "controlado" ? "error" : "warning"}
                      />
                    )}
                  </Box>
                </Box>
              );
            }}
            value={selectedInventory}
            onChange={(_, newValue) => {
              setSelectedInventory(newValue);
              setStockMsg(null);
            }}
            renderInput={(params) => (
              <TextField {...params} label="Producto (nombre, código de barras o principio activo)" size="small" />
            )}
            sx={{ flex: 1, width: "100%" }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={addItem}
            disabled={!selectedInventory}
            sx={{ width: { xs: "100%", sm: "auto" }, flexShrink: 0 }}
          >
            Agregar
          </Button>
        </Box>

        {stockMsg && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            {stockMsg}
          </Alert>
        )}

        {selectedInventory && (
          <Box sx={{ mt: 1, p: 1.5, borderRadius: 1, bgcolor: "action.hover" }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {selectedInventory.product_name || "Producto"}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
              {[
                selectedInventory.product_laboratory && `Laboratorio: ${selectedInventory.product_laboratory}`,
                selectedInventory.product_active_ingredient &&
                  `Principio activo: ${selectedInventory.product_active_ingredient}`,
                selectedInventory.product_concentration &&
                  `Concentración: ${selectedInventory.product_concentration}`,
              ]
                .filter(Boolean)
                .join(" · ") || "Este producto no tiene laboratorio/principio activo/concentración registrados"}
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mt: 0.5 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: (theme) => theme.palette[getStockColor(selectedInventory.quantity_available)].main,
                }}
              >
                {selectedInventory.quantity_available <= 0
                  ? "Sin stock disponible"
                  : `Stock disponible: ${selectedInventory.quantity_available}`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Ubicación: {selectedInventory.area_name || "Sin ubicación asignada"}
              </Typography>
            </Box>
          </Box>
        )}

        {earlierLotForSelected && (
          <Alert severity="info" sx={{ mt: 1 }}>
            Sugerencia FEFO: hay otro lote de este producto que vence antes (
            {formatDate(earlierLotForSelected.expiry_date as string)}). Considere venderlo
            primero para evitar que caduque en el estante.
          </Alert>
        )}

        {selectedInventory?.product_sale_control && selectedInventory.product_sale_control !== "libre" && (
          <Alert severity={selectedInventory.product_sale_control === "controlado" ? "error" : "warning"} sx={{ mt: 1 }}>
            {selectedInventory.product_sale_control === "controlado"
              ? "Producto de control especial — verifique receta y registre según protocolo antes de vender."
              : "Producto que requiere receta médica — verifique la receta antes de vender."}
          </Alert>
        )}

        {similarNameWarnings.length > 0 && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            Cuidado: existen productos con nombre parecido que podrían confundirse —{" "}
            {similarNameWarnings
              .map((item) =>
                [item.product_name, item.product_laboratory, item.product_concentration]
                  .filter(Boolean)
                  .join(" ")
              )
              .join(", ")}
            . Verifique que seleccionó el producto correcto antes de agregarlo.
          </Alert>
        )}

        <Typography variant="h6" sx={{ mt: 2.5, mb: 1 }}>
          Productos {items.length > 0 && `(${items.length})`}
        </Typography>

        {items.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
            Busca un producto arriba para agregarlo a la venta.
          </Typography>
        )}

        {items.map((item, index) => {
          const maxQuantity = item.inventory?.quantity_available;
          return (
            <Paper key={`${item.inventory_id}-${index}`} variant="outlined" sx={{ p: 1.5, mb: 1 }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {item.inventory?.product_name || `ID: ${item.inventory_id}`}
                  </Typography>
                  {(item.inventory?.product_laboratory ||
                    item.inventory?.product_active_ingredient ||
                    item.inventory?.product_concentration) && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      {[
                        item.inventory?.product_laboratory,
                        item.inventory?.product_active_ingredient,
                        item.inventory?.product_concentration,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </Typography>
                  )}
                  {item.inventory?.product_sale_control && item.inventory.product_sale_control !== "libre" && (
                    <Chip
                      size="small"
                      label={SALE_CONTROL_LABELS[item.inventory.product_sale_control]}
                      color={item.inventory.product_sale_control === "controlado" ? "error" : "warning"}
                      sx={{ mt: 0.5 }}
                    />
                  )}
                </Box>
                <IconButton
                  aria-label="Quitar producto"
                  color="error"
                  size="small"
                  onClick={() => removeItem(index)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1, flexWrap: "wrap" }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <IconButton
                    aria-label="Disminuir cantidad"
                    size="small"
                    onClick={() => updateItem(index, { quantity: item.quantity - 1 })}
                    disabled={item.quantity <= 1}
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <Typography sx={{ minWidth: 32, textAlign: "center", fontWeight: 600 }}>
                    {item.quantity}
                  </Typography>
                  <IconButton
                    aria-label="Aumentar cantidad"
                    size="small"
                    onClick={() => updateItem(index, { quantity: item.quantity + 1 })}
                    disabled={maxQuantity !== undefined && item.quantity >= maxQuantity}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
                <TextField
                  label="Precio unit."
                  type="number"
                  size="small"
                  value={item.unit_price}
                  onChange={(e) =>
                    updateItem(index, { unit_price: parseFloat(e.target.value) || 0 })
                  }
                  inputProps={{ step: "0.01", min: "0" }}
                  sx={{ width: 110 }}
                />
                <Typography sx={{ ml: "auto", fontWeight: 700 }}>
                  {formatMoney(item.subtotal)}
                </Typography>
              </Box>
            </Paper>
          );
        })}
      </DialogContent>

      <Box sx={{ px: { xs: 2, sm: 3 }, pt: 1.5 }}>
        <ToggleButtonGroup
          exclusive
          fullWidth
          size="small"
          color="primary"
          value={formData.payment_method}
          onChange={(_, value) => value && onChange("payment_method", value as PaymentMethod)}
        >
          {PAYMENT_METHODS.map((method) => (
            <ToggleButton key={method} value={method}>
              {PAYMENT_METHOD_LABELS[method]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mt: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            Total
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {formatMoney(total)}
          </Typography>
        </Box>

        {formData.payment_method === "efectivo" && total > 0 && (
          <Box sx={{ display: "flex", gap: 1.5, mt: 1, alignItems: "center" }}>
            <TextField
              label="Monto recibido"
              type="number"
              size="small"
              value={received}
              onChange={(e) => setReceived(e.target.value)}
              inputProps={{ step: "0.01", min: "0", inputMode: "decimal" }}
              sx={{ maxWidth: 170 }}
            />
            <Box sx={{ ml: "auto", textAlign: "right" }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                Cambio
              </Typography>
              <Typography
                sx={{
                  fontWeight: 700,
                  color: change !== null && change < 0 ? "error.main" : "success.main",
                }}
              >
                {change === null
                  ? "—"
                  : change < 0
                    ? `Faltan ${formatMoney(-change)}`
                    : formatMoney(change)}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: 2, pt: 1.5 }}>
        <Button onClick={onClose} disabled={submitting}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!items.length || submitting}
          sx={{ flexGrow: { xs: 1, sm: 0 } }}
        >
          {submitting
            ? "Guardando…"
            : isEditing
              ? "Guardar cambios"
              : `Cobrar ${formatMoney(total)}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
