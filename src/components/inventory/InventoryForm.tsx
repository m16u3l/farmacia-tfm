import {
  Autocomplete,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Grid,
  Typography,
  useMediaQuery,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { InventoryArea, InventoryFormData, Product } from "@/types";
import { buildAreaOptions } from "@/utils/areaTree";
import { smartSearch } from "@/utils/smartSearch";

// Mismo buscador inteligente que usa la tabla de inventario (acentos, typos, orden libre)
const filterProductOptions = (options: Product[], state: { inputValue: string }) =>
  smartSearch(options, state.inputValue, (product) => [
    product.name,
    product.active_ingredient,
    product.barcode,
    product.laboratory,
    product.concentration,
    product.category,
  ]);

interface InventoryFormProps {
  open: boolean;
  isEditing: boolean;
  formData: InventoryFormData;
  products: Product[];
  areas: InventoryArea[];
  onClose: () => void;
  onSubmit: (data: InventoryFormData) => void;
  onChange: (field: keyof InventoryFormData, value: string | number | null) => void;
}

export function InventoryForm({
  open,
  isEditing,
  formData,
  products,
  areas,
  onClose,
  onSubmit,
  onChange,
}: InventoryFormProps) {
  const fullScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));
  const areaOptions = buildAreaOptions(areas);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog fullScreen={fullScreen} open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {isEditing ? "Editar Inventario" : "Nuevo Item de Inventario"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <Autocomplete
                options={products}
                filterOptions={filterProductOptions}
                value={products.find((p) => p.product_id === formData.product_id) ?? null}
                onChange={(_, newValue) => onChange("product_id", newValue?.product_id ?? null)}
                getOptionLabel={(option) =>
                  [option.name, option.concentration].filter(Boolean).join(" ")
                }
                isOptionEqualToValue={(option, value) => option.product_id === value.product_id}
                noOptionsText="Sin resultados"
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.product_id}>
                    <Box>
                      <Typography variant="body2">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {[option.laboratory, option.active_ingredient, option.concentration, option.category]
                          .filter(Boolean)
                          .join(" · ") || "Sin datos adicionales"}
                      </Typography>
                    </Box>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    autoFocus
                    label="Producto (nombre, principio activo, código…)"
                    required
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Número de Lote"
                fullWidth
                value={formData.batch_number ?? ""}
                onChange={(e) => onChange("batch_number", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Fecha de Vencimiento"
                type="date"
                fullWidth
                value={formData.expiry_date ? formData.expiry_date.split('T')[0] : ""}
                onChange={(e) => onChange("expiry_date", e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Cantidad Disponible"
                type="number"
                fullWidth
                value={formData.quantity_available}
                onChange={(e) => onChange("quantity_available", parseInt(e.target.value))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Ubicación"
                fullWidth
                value={formData.area_id ?? ""}
                onChange={(e) => onChange("area_id", e.target.value ? parseInt(e.target.value) : null)}
                required
                helperText='Si aún no tiene ubicación definida, usa "Por clasificar"'
              >
                {areaOptions.map(({ area, depth, label }) => (
                  <MenuItem key={area.area_id} value={area.area_id} sx={{ pl: 2 + depth * 2 }}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Precio de Compra"
                type="number"
                fullWidth
                value={formData.purchase_price ?? ""}
                onChange={(e) => onChange("purchase_price", parseFloat(e.target.value))}
                inputProps={{ step: "0.01" }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Precio de Venta"
                type="number"
                fullWidth
                value={formData.sale_price ?? ""}
                onChange={(e) => onChange("sale_price", parseFloat(e.target.value))}
                inputProps={{ step: "0.01" }}
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
