import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
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
          <TextField
            autoFocus
            margin="dense"
            label="Nombre"
            fullWidth
            value={formData.first_name ?? ""}
            onChange={(e) => onChange("first_name", e.target.value)}
            required
          />
          <TextField
            margin="dense"
            label="Apellido"
            fullWidth
            value={formData.last_name ?? ""}
            onChange={(e) => onChange("last_name", e.target.value)}
            required
          />
          <TextField
            margin="dense"
            label="Cargo"
            fullWidth
            value={formData.role ?? ""}
            onChange={(e) => onChange("role", e.target.value)}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={formData.email ?? ""}
            onChange={(e) => onChange("email", e.target.value)}
          />
          <TextField
            margin="dense"
            label="Teléfono"
            fullWidth
            value={formData.phone ?? ""}
            onChange={(e) => onChange("phone", e.target.value)}
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
