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
  Alert,
  Grid,
} from "@mui/material";
import { UserFormData, UserRole } from "@/types/user";
import { ROLE_LABELS } from "@/lib/permissions";

interface UsuarioFormProps {
  open: boolean;
  isEditing: boolean;
  formData: UserFormData;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onChange: (field: keyof UserFormData, value: string | boolean) => void;
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
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre"
                value={formData.first_name || ""}
                onChange={(e) => onChange("first_name", e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Apellidos"
                value={formData.last_name || ""}
                onChange={(e) => onChange("last_name", e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Correo"
                type="email"
                value={formData.email || ""}
                onChange={(e) => onChange("email", e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Rol"
                value={formData.role || "cajero"}
                onChange={(e) => onChange("role", e.target.value)}
                required
                helperText="Define a qué secciones del panel puede entrar"
              >
                {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
                  <MenuItem key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={isEditing ? "Nueva contraseña" : "Contraseña"}
                type="password"
                value={formData.password || ""}
                onChange={(e) => onChange("password", e.target.value)}
                required={!isEditing}
                helperText={
                  isEditing
                    ? "Déjalo vacío para no cambiar la contraseña actual"
                    : "Mínimo 8 caracteres"
                }
              />
            </Grid>
            {isEditing && (
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_active ?? true}
                      onChange={(e) => onChange("is_active", e.target.checked)}
                    />
                  }
                  label="Cuenta activa (puede iniciar sesión)"
                />
              </Grid>
            )}
            {!isEditing && (
              <Grid item xs={12}>
                <Alert severity="info">
                  El usuario podrá iniciar sesión de inmediato con el correo y la
                  contraseña que definas aquí.
                </Alert>
              </Grid>
            )}
          </Grid>
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
