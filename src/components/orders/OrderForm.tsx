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
import { OrderFormData, OrderItem } from "@/types";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useState } from "react";

interface OrderFormProps {
  open: boolean;
  isEditing: boolean;
  formData: OrderFormData;
  onClose: () => void;
  onSubmit: (data: OrderFormData) => void;
  onChange: (field: keyof OrderFormData, value: unknown) => void;
}

export function OrderForm({
  open,
  isEditing,
  formData,
  onClose,
  onSubmit,
  onChange,
}: OrderFormProps) {
  const [newItem, setNewItem] = useState<Partial<OrderItem>>({
    product_id: 0,
    quantity: 1,
    unit_price: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addItem = () => {
    if (newItem.product_id && newItem.quantity && newItem.unit_price) {
      onChange("items", [...(formData.items || []), newItem as OrderItem]);
      setNewItem({ product_id: 0, quantity: 1, unit_price: 0 });
    }
  };

  const removeItem = (index: number) => {
    const items = [...(formData.items || [])];
    items.splice(index, 1);
    onChange("items", items);
  };

  const ORDER_STATUS = ["pendiente", "aprobado", "recibido", "cancelado"];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {isEditing ? "Editar Pedido" : "Nuevo Pedido"}
        </DialogTitle>
        <DialogContent>
          <TextField
            select
            margin="dense"
            label="Proveedor"
            fullWidth
            value={formData.supplier_id}
            onChange={(e) => onChange("supplier_id", parseInt(e.target.value))}
            required
          >
            {/* Add supplier options here */}
          </TextField>

          {isEditing && (
            <TextField
              select
              margin="dense"
              label="Estado"
              fullWidth
              value={formData.status}
              onChange={(e) => onChange("status", e.target.value)}
              required
            >
              {ORDER_STATUS.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>
          )}

          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            Items del Pedido
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
                label="Producto ID"
                type="number"
                value={item.product_id}
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
              label="Producto ID"
              type="number"
              value={newItem.product_id}
              onChange={(e) =>
                setNewItem({ ...newItem, product_id: parseInt(e.target.value) })
              }
              size="small"
            />
            <TextField
              label="Cantidad"
              type="number"
              value={newItem.quantity}
              onChange={(e) =>
                setNewItem({ ...newItem, quantity: parseInt(e.target.value) })
              }
              size="small"
            />
            <TextField
              label="Precio Unitario"
              type="number"
              value={newItem.unit_price}
              onChange={(e) =>
                setNewItem({ ...newItem, unit_price: parseFloat(e.target.value) })
              }
              size="small"
              inputProps={{ step: "0.01" }}
            />
            <IconButton color="primary" onClick={addItem} size="small">
              <AddIcon />
            </IconButton>
          </Box>
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
