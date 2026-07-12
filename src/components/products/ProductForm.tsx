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
  Grid,
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
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                label="Nombre"
                fullWidth
                value={formData.name ?? ""}
                onChange={(e) => onChange("name", e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Descripción"
                fullWidth
                multiline
                rows={3}
                value={formData.description ?? ""}
                onChange={(e) => onChange("description", e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Usos posibles"
                fullWidth
                multiline
                rows={2}
                placeholder="Ej. alivio del dolor leve a moderado, fiebre"
                helperText="Indicaciones del producto, para consulta rápida en mostrador"
                value={formData.possible_uses ?? ""}
                onChange={(e) => onChange("possible_uses", e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Información adicional"
                fullWidth
                multiline
                rows={2}
                placeholder="Ej. precauciones, contraindicaciones, conservación"
                helperText="Precauciones, contraindicaciones u otra información relevante"
                value={formData.additional_info ?? ""}
                onChange={(e) => onChange("additional_info", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
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
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
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
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
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
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
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
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Código de barras"
                fullWidth
                value={formData.barcode ?? ""}
                onChange={(e) => onChange("barcode", e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Instrucciones de dosificación"
                fullWidth
                placeholder="Ej. cada 12 horas, adultos"
                helperText="Opcional. Indicación de uso o posología del producto."
                value={formData.dosage_instructions ?? ""}
                onChange={(e) => onChange("dosage_instructions", e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.status}
                    onChange={(e) => onChange("status", e.target.checked)}
                  />
                }
                label="Activo"
              />
            </Grid>
          </Grid>
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
