import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Grid,
  FormControlLabel,
  Checkbox,
  useMediaQuery,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { AREA_TYPES, InventoryArea, InventoryAreaFormData } from "@/types";
import { buildAreaOptions } from "@/utils/areaTree";

interface AreaFormProps {
  open: boolean;
  isEditing: boolean;
  editingAreaId: number | null;
  formData: InventoryAreaFormData;
  areas: InventoryArea[];
  onClose: () => void;
  onSubmit: (data: InventoryAreaFormData) => void;
  onChange: (field: keyof InventoryAreaFormData, value: string | number | boolean | null) => void;
}

export function AreaForm({
  open,
  isEditing,
  editingAreaId,
  formData,
  areas,
  onClose,
  onSubmit,
  onChange,
}: AreaFormProps) {
  const fullScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));
  const parentOptions = buildAreaOptions(areas, editingAreaId ?? undefined);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog fullScreen={fullScreen} open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{isEditing ? "Editar Área" : "Nueva Área"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                label="Nombre"
                fullWidth
                value={formData.name}
                onChange={(e) => onChange("name", e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Tipo"
                fullWidth
                value={formData.type}
                onChange={(e) => onChange("type", e.target.value)}
              >
                {AREA_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Área Padre"
                fullWidth
                value={formData.parent_area_id ?? ""}
                onChange={(e) => onChange("parent_area_id", e.target.value ? parseInt(e.target.value) : null)}
              >
                <MenuItem value="">
                  <em>Sin área padre</em>
                </MenuItem>
                {parentOptions.map(({ area, depth, label }) => (
                  <MenuItem key={area.area_id} value={area.area_id} sx={{ pl: 2 + depth * 2 }}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.is_active}
                    onChange={(e) => onChange("is_active", e.target.checked)}
                  />
                }
                label="Activa"
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
