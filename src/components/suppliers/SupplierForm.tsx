import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";
import { SupplierFormData } from "@/types";

interface SupplierFormProps {
  open: boolean;
  isEditing: boolean;
  formData: SupplierFormData;
  onClose: () => void;
  onSubmit: (data: SupplierFormData) => void;
  onChange: (field: keyof SupplierFormData, value: string) => void;
}

export function SupplierForm({
  open,
  isEditing,
  formData,
  onClose,
  onSubmit,
  onChange,
}: SupplierFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {isEditing ? "Editar Proveedor" : "Nuevo Proveedor"}
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
            label="Nombre de Contacto"
            fullWidth
            value={formData.contact_name ?? ""}
            onChange={(e) => onChange("contact_name", e.target.value)}
          />
          <TextField
            margin="dense"
            label="Teléfono"
            fullWidth
            value={formData.phone ?? ""}
            onChange={(e) => onChange("phone", e.target.value)}
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
            label="Dirección"
            fullWidth
            multiline
            rows={3}
            value={formData.address ?? ""}
            onChange={(e) => onChange("address", e.target.value)}
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
