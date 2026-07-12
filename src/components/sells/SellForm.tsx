import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  IconButton,
  Box,
  Typography,
  Autocomplete,
  createFilterOptions,
  Grid,
  Alert,
  Chip,
} from "@mui/material";
import { SellFormData, SellItem, PaymentMethod, PAYMENT_METHOD_LABELS, Inventory } from "@/types";
import { SALE_CONTROL_LABELS } from "@/types/products";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
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
  onSubmit: (data: SellFormData) => void;
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
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
  const [newItem, setNewItem] = useState<Partial<SellItem>>({
    inventory_id: 0,
    quantity: 1,
    unit_price: 0,
    subtotal: 0,
  });

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const inventoryResponse = await fetch('/api/inventory');
        const inventoryData = await inventoryResponse.json();
        setInventory(inventoryData.filter((item: Inventory) => item.quantity_available > 0));
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    if (open) {
      fetchInventory();
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addItem = () => {
    if (selectedInventory && newItem.quantity && newItem.unit_price) {
      // Verificar que no exceda el stock disponible
      if (newItem.quantity > selectedInventory.quantity_available) {
        alert(`Stock insuficiente. Disponible: ${selectedInventory.quantity_available}`);
        return;
      }

      const subtotal = newItem.quantity * newItem.unit_price;
      const item: SellItem = {
        sell_item_id: 0,
        sell_id: 0,
        inventory_id: selectedInventory.inventory_id,
        quantity: newItem.quantity,
        unit_price: newItem.unit_price,
        subtotal: subtotal,
        inventory: selectedInventory
      };
      onChange("items", [...(formData.items || []), item]);
      setNewItem({ inventory_id: 0, quantity: 1, unit_price: 0, subtotal: 0 });
      setSelectedInventory(null);
    }
  };

  const removeItem = (index: number) => {
    const items = [...(formData.items || [])];
    items.splice(index, 1);
    onChange("items", items);
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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {isEditing ? "Editar Venta" : "Nueva Venta"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5, mb: 2 }}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                select
                label="Método de Pago"
                value={formData.payment_method}
                onChange={(e) =>
                  onChange("payment_method", e.target.value as PaymentMethod)
                }
                fullWidth
                required
              >
                {PAYMENT_METHODS.map((method) => (
                  <MenuItem key={method} value={method}>
                    {PAYMENT_METHOD_LABELS[method]}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            Items de la Venta
          </Typography>

          {formData.items?.map((item, index) => (
            <Box
              key={index}
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                alignItems: "center",
                mb: 1,
              }}
            >
              <Box sx={{ flex: "2 1 160px" }}>
                <TextField
                  label="Producto"
                  value={item.inventory?.product_name || `ID: ${item.inventory_id}`}
                  disabled
                  size="small"
                  fullWidth
                />
                {(item.inventory?.product_laboratory ||
                  item.inventory?.product_active_ingredient ||
                  item.inventory?.product_concentration) && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
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
              <TextField
                label="Cantidad"
                type="number"
                value={item.quantity}
                disabled
                size="small"
                sx={{ flex: "1 1 100px" }}
              />
              <TextField
                label="Precio Unitario"
                type="number"
                value={item.unit_price}
                disabled
                size="small"
                sx={{ flex: "1 1 100px" }}
              />
              <TextField
                label="Subtotal"
                type="number"
                value={item.subtotal}
                disabled
                size="small"
                sx={{ flex: "1 1 100px" }}
              />
              <IconButton
                color="error"
                onClick={() => removeItem(index)}
                size="small"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center", mt: 2 }}>
            <Autocomplete
              options={sortedInventory}
              filterOptions={filterInventoryOptions}
              getOptionLabel={(option) =>
                [option.product_name || "Producto", option.product_laboratory, option.product_concentration]
                  .filter(Boolean)
                  .join(" - ")
              }
              getOptionKey={(option) => option.inventory_id}
              renderOption={(props, option) => (
                <Box component="li" {...props} key={option.inventory_id}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2">{option.product_name || "Producto"}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {[option.product_laboratory, option.product_active_ingredient, option.product_concentration]
                          .filter(Boolean)
                          .join(" · ") || "Sin datos de laboratorio/principio activo"}
                        {` — Stock: ${option.quantity_available}`}
                        {option.expiry_date && ` — Vence: ${new Date(option.expiry_date).toLocaleDateString()}`}
                      </Typography>
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
              )}
              value={selectedInventory}
              onChange={(_, newValue) => {
                setSelectedInventory(newValue);
                if (newValue) {
                  setNewItem({
                    ...newItem,
                    inventory_id: newValue.inventory_id,
                    unit_price: newValue.sale_price || 0
                  });
                }
              }}
              renderInput={(params) => (
                <TextField {...params} label="Producto (nombre, código de barras o principio activo)" size="small" />
              )}
              sx={{ flex: "2 1 200px" }}
            />
            <TextField
              label="Cantidad"
              type="number"
              value={newItem.quantity}
              onChange={(e) => {
                const quantity = parseInt(e.target.value);
                const subtotal = quantity * (newItem.unit_price || 0);
                setNewItem({ ...newItem, quantity, subtotal });
              }}
              size="small"
              sx={{ flex: "1 1 100px" }}
            />
            <TextField
              label="Precio Unitario"
              type="number"
              value={newItem.unit_price}
              onChange={(e) => {
                const unit_price = parseFloat(e.target.value) || 0;
                const subtotal = (newItem.quantity || 0) * unit_price;
                setNewItem({ ...newItem, unit_price, subtotal });
              }}
              size="small"
              sx={{ flex: "1 1 100px" }}
              inputProps={{ step: "0.01", min: "0" }}
            />
            <TextField
              label="Subtotal"
              type="number"
              value={newItem.subtotal}
              disabled
              size="small"
              sx={{ flex: "1 1 100px" }}
            />
            <IconButton
              color="primary"
              onClick={addItem}
              size="small"
              disabled={!selectedInventory || !newItem.quantity || newItem.quantity <= 0}
            >
              <AddIcon />
            </IconButton>
          </Box>

          {selectedInventory && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Confirmar:{" "}
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
            </Box>
          )}

          {earlierLotForSelected && (
            <Alert severity="info" sx={{ mt: 1 }}>
              Sugerencia FEFO: hay otro lote de este producto que vence antes (
              {new Date(earlierLotForSelected.expiry_date as string).toLocaleDateString()}). Considere venderlo
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

          <TextField
            label="Total"
            type="number"
            value={formData.items?.reduce((sum, item) => sum + item.subtotal, 0) ?? 0}
            fullWidth
            disabled
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!formData.items?.length}
          >
            {isEditing ? "Guardar" : "Crear"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
