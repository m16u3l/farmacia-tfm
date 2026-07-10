import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
} from "@mui/material";
import { EmployeeFormData } from "@/types";

interface EmployeeFormProps {
  open: boolean;
  isEditing: boolean;
  formData: EmployeeFormData;
  onClose: () => void;
  onSubmit: (data: EmployeeFormData) => void;
  onChange: (field: keyof EmployeeFormData, value: string) => void;
}

export function EmployeeForm({
  open,
  isEditing,
  formData,
  onClose,
  onSubmit,
  onChange,
}: EmployeeFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {isEditing ? "Editar Empleado" : "Nuevo Empleado"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                autoFocus
                label="Nombre"
                fullWidth
                value={formData.first_name ?? ""}
                onChange={(e) => onChange("first_name", e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Apellido"
                fullWidth
                value={formData.last_name ?? ""}
                onChange={(e) => onChange("last_name", e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Cargo"
                fullWidth
                value={formData.role ?? ""}
                onChange={(e) => onChange("role", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={formData.email ?? ""}
                onChange={(e) => onChange("email", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Teléfono"
                fullWidth
                value={formData.phone ?? ""}
                onChange={(e) => onChange("phone", e.target.value)}
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
