import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";
import { UserFormData } from "@/types/user";

interface UsuarioFormProps {
  open: boolean;
  isEditing: boolean;
  formData: UserFormData;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onChange: (field: keyof UserFormData, value: string) => void;
}

export function UserForm({
  open,
  isEditing,
  formData,
  onClose,
  onSubmit,
  onChange,
}: UsuarioFormProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={onSubmit}>
        <DialogTitle>
          {isEditing ? "Editar Usuario" : "Nuevo Usuario"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nombre"
            name="Nombre"
            value={formData.first_name}
            onChange={(e) => onChange("first_name", e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Apellidos"
            name="Apellidos"
            value={formData.last_name}
            onChange={(e) => onChange("last_name", e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Correo"
            name="Correo"
            type="email"
            value={formData.email}
            onChange={(e) => onChange("email", e.target.value)}
            margin="normal"
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained">
            {isEditing ? "Actualizar" : "Crear"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
