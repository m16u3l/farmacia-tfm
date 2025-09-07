import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  FormControlLabel,
  Switch,
} from "@mui/material";
import {
  ProductFormData,
  DOSAGE_FORMS,
  PRODUCT_TYPES,
  PRODUCT_CATEGORIES,
  PRODUCT_UNITS,
} from "@/types/products";


interface ProductFormProps {
  open: boolean;
  isEditing: boolean;
  formData: ProductFormData;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => void;
  onChange: (field: keyof ProductFormData, value: string | number | boolean) => void;
}

export function ProductForm({
  open,
  isEditing,
  formData,
  onClose,
  onSubmit,
  onChange,
}: ProductFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {isEditing ? "Editar Producto" : "Nuevo Producto"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre"
            fullWidth
            value={formData.name ?? ""}
            onChange={(e) => onChange("name", e.target.value)}
            required
          />
          <TextField
            margin="dense"
            label="Descripción"
            fullWidth
            multiline
            rows={3}
            value={formData.description ?? ""}
            onChange={(e) => onChange("description", e.target.value)}
          />
          <TextField
            select
            margin="dense"
            label="Categoría"
            fullWidth
            value={formData.category ?? ""}
            onChange={(e) => onChange("category", e.target.value)}
          >
            {PRODUCT_CATEGORIES.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            margin="dense"
            label="Tipo"
            fullWidth
            value={formData.type ?? ""}
            onChange={(e) => onChange("type", e.target.value)}
          >
            {PRODUCT_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            margin="dense"
            label="Forma farmacéutica"
            fullWidth
            value={formData.dosage_form ?? ""}
            onChange={(e) => onChange("dosage_form", e.target.value)}
          >
            {DOSAGE_FORMS.map((form) => (
              <MenuItem key={form} value={form}>
                {form}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            margin="dense"
            label="Unidad"
            fullWidth
            value={formData.unit ?? ""}
            onChange={(e) => onChange("unit", e.target.value)}
          >
            {PRODUCT_UNITS.map((unit) => (
              <MenuItem key={unit} value={unit}>
                {unit}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            margin="dense"
            label="Código de barras"
            fullWidth
            value={formData.barcode ?? ""}
            onChange={(e) => onChange("barcode", e.target.value)}
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.status}
                onChange={(e) => onChange("status", e.target.checked)}
              />
            }
            label="Activo"
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
