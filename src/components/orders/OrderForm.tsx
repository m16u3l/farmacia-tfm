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
import { OrderFormData, OrderItem, Supplier, Product } from "@/types";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useState, useEffect } from "react";

interface OrderFormProps {
  open: boolean;
  isEditing: boolean;
  formData: OrderFormData;
  suppliers: Supplier[];
  onClose: () => void;
  onSubmit: (data: OrderFormData) => void;
  onChange: (field: keyof OrderFormData, value: unknown) => void;
}

export function OrderForm({
  open,
  isEditing,
  formData,
  suppliers,
  onClose,
  onSubmit,
  onChange,
}: OrderFormProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [newItem, setNewItem] = useState<Partial<OrderItem>>({
    product_id: 0,
    quantity: 0,
    unit_price: 0,
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products");
        const data = await response.json();
        if (!response.ok) {
          console.error("Error al cargar productos:", data);
          setProducts([]);
        } else if (Array.isArray(data)) {
          setProducts(data);
        } else {
          console.error("Respuesta inesperada del servidor al cargar productos:", data);
          setProducts([]);
        }
      } catch (error) {
        console.error("Error al cargar productos:", error);
      }
    };
    if (open) {
      fetchProducts();
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addItem = () => {
    if (
      newItem.product_id && 
      newItem.product_id > 0 &&
      newItem.quantity && 
      newItem.quantity > 0 &&
      newItem.unit_price !== undefined && 
      newItem.unit_price >= 0 &&
      !isNaN(newItem.quantity) &&
      !isNaN(newItem.unit_price)
    ) {
      const itemToAdd: OrderItem = {
        product_id: newItem.product_id,
        quantity: Number(newItem.quantity),
        unit_price: Number(newItem.unit_price),
      } as OrderItem;
      
      onChange("items", [...(formData.items || []), itemToAdd]);
      setNewItem({ product_id: 0, quantity: 0, unit_price: 0 });
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
            <MenuItem value={0} disabled>
              Selecciona un proveedor
            </MenuItem>
            {suppliers.map((supplier) => (
              <MenuItem key={supplier.supplier_id} value={supplier.supplier_id}>
                {supplier.name}
              </MenuItem>
            ))}
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

          {formData.items?.map((item, index) => {
            const product = products.find(p => p.product_id === item.product_id);
            return (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  gap: 1,
                  alignItems: "center",
                  mb: 1,
                  p: 1,
                  bgcolor: "grey.100",
                  borderRadius: 1,
                }}
              >
                <TextField
                  label="Producto"
                  value={product?.name || `ID: ${item.product_id}`}
                  disabled
                  size="small"
                  sx={{ flex: 2 }}
                />
                <TextField
                  label="Cantidad"
                  type="number"
                  value={item.quantity}
                  disabled
                  size="small"
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Precio"
                  type="number"
                  value={item.unit_price}
                  disabled
                  size="small"
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Subtotal"
                  value={`$${(item.quantity * item.unit_price)}`}
                  disabled
                  size="small"
                  sx={{ flex: 1 }}
                />
                <IconButton
                  color="error"
                  onClick={() => removeItem(index)}
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            );
          })}

          <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 2, p: 1, border: "1px dashed", borderColor: "primary.main", borderRadius: 1 }}>
            <TextField
              select
              label="Producto"
              value={newItem.product_id || 0}
              onChange={(e) =>
                setNewItem({ ...newItem, product_id: parseInt(e.target.value) })
              }
              size="small"
              sx={{ flex: 2 }}
            >
              <MenuItem value={0} disabled>
                Selecciona un producto
              </MenuItem>
              {products.map((product) => (
                <MenuItem key={product.product_id} value={product.product_id}>
                  {product.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Cantidad"
              type="number"
              value={newItem.quantity || ''}
              onChange={(e) => {
                const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                setNewItem({ ...newItem, quantity: isNaN(value) ? 0 : value });
              }}
              size="small"
              sx={{ flex: 1 }}
              inputProps={{ min: 1 }}
            />
            <TextField
              label="Precio Unitario"
              type="number"
              value={newItem.unit_price || ''}
              onChange={(e) => {
                const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                setNewItem({ ...newItem, unit_price: isNaN(value) ? 0 : value });
              }}
              size="small"
              sx={{ flex: 1 }}
              inputProps={{ step: "0.01", min: 0 }}
            />
            <IconButton color="primary" onClick={addItem} size="small">
              <AddIcon />
            </IconButton>
          </Box>

          {formData.items && formData.items.length > 0 && (
            <Box sx={{ mt: 2, p: 2, bgcolor: "primary.light", borderRadius: 1 }}>
              <Typography variant="h6" sx={{ color: "white", fontWeight: "bold" }}>
                Total: ${(formData.total_amount || 0)}
              </Typography>
            </Box>
          )}
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
