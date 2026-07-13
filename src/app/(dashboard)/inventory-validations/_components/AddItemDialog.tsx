"use client";
import { formatDate } from "@/utils/dateUtils";
import { useEffect, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
  useMediaQuery,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import { AddValidationItemInput, Inventory, Product } from "@/types";

// "Nuevo lote" como valor centinela del select de lotes — los reales usan su
// inventory_id numérico.
const NEW_LOT = "new";

interface AddItemDialogProps {
  open: boolean;
  areaName: string;
  products: Product[];
  inventory: Inventory[];
  // inventory_id de los lotes que ya son ítems de la validación activa — se
  // excluyen de la lista de lotes vinculables.
  existingInventoryIds: number[];
  onClose: () => void;
  onSubmit: (data: AddValidationItemInput) => void;
}

const QUANTITY_PATTERN = /^\d+$/;

export function AddItemDialog({
  open,
  areaName,
  products,
  inventory,
  existingInventoryIds,
  onClose,
  onSubmit,
}: AddItemDialogProps) {
  const fullScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));
  const [product, setProduct] = useState<Product | null>(null);
  const [lotSelection, setLotSelection] = useState<string>(NEW_LOT);
  const [quantityInput, setQuantityInput] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setProduct(null);
      setLotSelection(NEW_LOT);
      setQuantityInput("");
      setBatchNumber("");
      setExpiryDate("");
      setPurchasePrice("");
      setSalePrice("");
      setNotes("");
    }
  }, [open]);

  // Lotes del producto elegido que aún no forman parte de la validación —
  // candidatos a "estaba registrado en otra parte, pero físicamente está aquí".
  const linkableLots = product
    ? inventory.filter(
        (lot) =>
          lot.product_id === product.product_id &&
          !existingInventoryIds.includes(lot.inventory_id)
      )
    : [];

  const isNewLot = lotSelection === NEW_LOT;
  const trimmedQuantity = quantityInput.trim();
  const parsedQuantity = QUANTITY_PATTERN.test(trimmedQuantity)
    ? parseInt(trimmedQuantity, 10)
    : null;
  const quantityInvalid = isNewLot && (parsedQuantity === null || parsedQuantity <= 0);

  const canSubmit = product !== null && (!isNewLot || !quantityInvalid);

  const handleProductChange = (value: Product | null) => {
    setProduct(value);
    setLotSelection(NEW_LOT);
  };

  const handleSubmit = () => {
    if (!product) return;
    if (isNewLot) {
      if (parsedQuantity === null || parsedQuantity <= 0) return;
      onSubmit({
        mode: "create",
        product_id: product.product_id,
        batch_number: batchNumber || null,
        expiry_date: expiryDate || null,
        quantity_available: parsedQuantity,
        purchase_price: purchasePrice ? parseFloat(purchasePrice) : 0,
        sale_price: salePrice ? parseFloat(salePrice) : 0,
        notes: notes || undefined,
      });
    } else {
      onSubmit({
        mode: "link",
        inventory_id: Number(lotSelection),
        notes: notes || undefined,
      });
    }
  };

  return (
    <Dialog fullScreen={fullScreen} open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Agregar ítem a la validación — {areaName}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Autocomplete
            options={products}
            value={product}
            onChange={(_, value) => handleProductChange(value)}
            getOptionLabel={(option) =>
              [option.name, option.laboratory, option.concentration]
                .filter(Boolean)
                .join(" - ")
            }
            isOptionEqualToValue={(option, value) => option.product_id === value.product_id}
            renderInput={(params) => (
              <TextField {...params} label="Producto" margin="normal" autoFocus />
            )}
          />

          {product && (
            <TextField
              select
              fullWidth
              label="Lote"
              value={lotSelection}
              onChange={(e) => setLotSelection(e.target.value)}
              margin="normal"
              helperText={
                linkableLots.length > 0
                  ? "Si el lote ya existe en el sistema (en otra área), vincúlalo: se reubicará a esta área."
                  : "Este producto no tiene lotes registrados fuera de esta validación."
              }
            >
              <MenuItem value={NEW_LOT}>Nuevo lote (no está en el sistema)</MenuItem>
              {linkableLots.map((lot) => (
                <MenuItem key={lot.inventory_id} value={String(lot.inventory_id)}>
                  {[
                    lot.batch_number ? `Lote ${lot.batch_number}` : "Sin lote",
                    `${lot.quantity_available} uds.`,
                    lot.expiry_date ? `vence ${formatDate(lot.expiry_date)}` : null,
                    lot.area_full_path || lot.area_name || "Sin área",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </MenuItem>
              ))}
            </TextField>
          )}

          {product && !isNewLot && (
            <Alert severity="info" sx={{ mt: 1 }}>
              El lote se reubicará a “{areaName}” y quedará pendiente de conteo en la
              lista de la validación.
            </Alert>
          )}

          {product && isNewLot && (
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Cantidad contada"
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(e.target.value)}
                  inputProps={{ min: 1 }}
                  error={trimmedQuantity.length > 0 && quantityInvalid}
                  helperText="El lote se creará con esta cantidad"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Número de Lote"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha de Vencimiento"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="P. Compra"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  inputProps={{ step: "0.01", min: 0 }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="P. Venta"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  inputProps={{ step: "0.01", min: 0 }}
                />
              </Grid>
            </Grid>
          )}

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Notas"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            margin="normal"
            placeholder="Ej.: encontrado en el estante durante el conteo"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          startIcon={<AddIcon />}
          disabled={!canSubmit}
        >
          {isNewLot ? "Crear y agregar" : "Vincular a la validación"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
