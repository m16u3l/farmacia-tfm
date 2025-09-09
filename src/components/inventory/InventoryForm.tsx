import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
} from "@mui/material";
import { InventoryFormData, Product } from "@/types";

interface InventoryFormProps {
  open: boolean;
  isEditing: boolean;
  formData: InventoryFormData;
  products: Product[];
  onClose: () => void;
  onSubmit: (data: InventoryFormData) => void;
  onChange: (field: keyof InventoryFormData, value: string | number | null) => void;
}

export function InventoryForm({
  open,
  isEditing,
  formData,
  products,
  onClose,
  onSubmit,
  onChange,
}: InventoryFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {isEditing ? "Editar Inventario" : "Nuevo Item de Inventario"}
        </DialogTitle>
        <DialogContent>
          <TextField
            select
            autoFocus
            margin="dense"
            label="Producto"
            fullWidth
            value={formData.product_id || ""}
            onChange={(e) => onChange("product_id", e.target.value ? parseInt(e.target.value) : null)}
            required
          >
            {products.map((product) => (
              <MenuItem key={product.product_id} value={product.product_id}>
                {product.name} - {product.category}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            margin="dense"
            label="Número de Lote"
            fullWidth
            value={formData.batch_number ?? ""}
            onChange={(e) => onChange("batch_number", e.target.value)}
          />
          <TextField
            margin="dense"
            label="Fecha de Vencimiento"
            type="date"
            fullWidth
            value={formData.expiry_date ? formData.expiry_date.split('T')[0] : ""}
            onChange={(e) => onChange("expiry_date", e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            margin="dense"
            label="Cantidad Disponible"
            type="number"
            fullWidth
            value={formData.quantity_available}
            onChange={(e) => onChange("quantity_available", parseInt(e.target.value))}
            required
          />
          <TextField
            margin="dense"
            label="Ubicación"
            fullWidth
            value={formData.location ?? ""}
            onChange={(e) => onChange("location", e.target.value)}
          />
          <TextField
            margin="dense"
            label="Precio de Compra"
            type="number"
            fullWidth
            value={formData.purchase_price ?? ""}
            onChange={(e) => onChange("purchase_price", parseFloat(e.target.value))}
            inputProps={{ step: "0.01" }}
          />
          <TextField
            margin="dense"
            label="Precio de Venta"
            type="number"
            fullWidth
            value={formData.sale_price ?? ""}
            onChange={(e) => onChange("sale_price", parseFloat(e.target.value))}
            inputProps={{ step: "0.01" }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained">
            {isEditing ? "Guardar" : "Crear"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
