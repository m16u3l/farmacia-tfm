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
  Grid,
} from "@mui/material";
import { SellFormData, SellItem, PaymentMethod, PAYMENT_METHOD_LABELS, Inventory } from "@/types";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useState, useEffect } from "react";

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
              <TextField
                label="Producto"
                value={item.inventory?.product_name || `ID: ${item.inventory_id}`}
                disabled
                size="small"
                sx={{ flex: "2 1 160px" }}
              />
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
              options={inventory}
              getOptionLabel={(option) => `${option.product_name || 'Producto'} - Stock: ${option.quantity_available}`}
              getOptionKey={(option) => option.inventory_id}
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
                <TextField {...params} label="Producto" size="small" />
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
