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
} from "@mui/material";
import { SellFormData, SellItem, PaymentMethod } from "@/types";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useState } from "react";

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
  const [newItem, setNewItem] = useState<Partial<SellItem>>({
    inventory_id: 0,
    quantity: 1,
    unit_price: 0,
    subtotal: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addItem = () => {
    if (newItem.inventory_id && newItem.quantity && newItem.unit_price) {
      const subtotal = newItem.quantity * newItem.unit_price;
      const item = { ...newItem, subtotal } as SellItem;
      onChange("items", [...(formData.items || []), item]);
      setNewItem({ inventory_id: 0, quantity: 1, unit_price: 0, subtotal: 0 });
    }
  };

  const removeItem = (index: number) => {
    const items = [...(formData.items || [])];
    items.splice(index, 1);
    onChange("items", items);
  };

  const PAYMENT_METHODS: PaymentMethod[] = [
    "efectivo",
    "tarjeta",
    "seguro",
    "transferencia",
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {isEditing ? "Editar Venta" : "Nueva Venta"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              margin="dense"
              label="Cliente ID"
              type="number"
              value={formData.customer_id ?? ""}
              onChange={(e) =>
                onChange("customer_id", parseInt(e.target.value))
              }
              fullWidth
            />
            <TextField
              margin="dense"
              label="Empleado ID"
              type="number"
              value={formData.employee_id ?? ""}
              onChange={(e) =>
                onChange("employee_id", parseInt(e.target.value))
              }
              fullWidth
            />
            <TextField
              select
              margin="dense"
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
                  {method}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            Items de la Venta
          </Typography>

          {formData.items?.map((item, index) => (
            <Box
              key={index}
              sx={{
                display: "flex",
                gap: 1,
                alignItems: "center",
                mb: 1,
              }}
            >
              <TextField
                label="Inventario ID"
                type="number"
                value={item.inventory_id}
                disabled
                size="small"
              />
              <TextField
                label="Cantidad"
                type="number"
                value={item.quantity}
                disabled
                size="small"
              />
              <TextField
                label="Precio Unitario"
                type="number"
                value={item.unit_price}
                disabled
                size="small"
              />
              <TextField
                label="Subtotal"
                type="number"
                value={item.subtotal}
                disabled
                size="small"
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

          <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 2 }}>
            <TextField
              label="Inventario ID"
              type="number"
              value={newItem.inventory_id}
              onChange={(e) =>
                setNewItem({ ...newItem, inventory_id: parseInt(e.target.value) })
              }
              size="small"
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
            />
            <TextField
              label="Precio Unitario"
              type="number"
              value={newItem.unit_price}
              onChange={(e) => {
                const unit_price = parseFloat(e.target.value);
                const subtotal = (newItem.quantity || 0) * unit_price;
                setNewItem({ ...newItem, unit_price, subtotal });
              }}
              size="small"
              inputProps={{ step: "0.01" }}
            />
            <TextField
              label="Subtotal"
              type="number"
              value={newItem.subtotal}
              disabled
              size="small"
            />
            <IconButton color="primary" onClick={addItem} size="small">
              <AddIcon />
            </IconButton>
          </Box>

          <TextField
            margin="dense"
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
