import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
} from "@mui/material";
import { ExpenseFormData, EXPENSE_CATEGORY_LABELS, ExpenseCategory } from "@/types";

interface ExpenseFormProps {
  open: boolean;
  isEditing: boolean;
  formData: ExpenseFormData;
  onClose: () => void;
  onSubmit: (data: ExpenseFormData) => void;
  onChange: (field: keyof ExpenseFormData, value: unknown) => void;
}

export function ExpenseForm({
  open,
  isEditing,
  formData,
  onClose,
  onSubmit,
  onChange,
}: ExpenseFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Un gasto vinculado a una orden de compra mantiene su categoría fija.
  const categoryLocked = formData.order_id !== null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{isEditing ? "Editar gasto" : "Registrar gasto"}</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="Categoría"
            fullWidth
            value={formData.category}
            onChange={(e) => onChange("category", e.target.value)}
            disabled={categoryLocked}
            required
            sx={{ mt: 1 }}
          >
            {(Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]).map((category) => (
              <MenuItem key={category} value={category}>
                {EXPENSE_CATEGORY_LABELS[category]}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Monto"
            type="number"
            fullWidth
            value={formData.amount}
            onChange={(e) => onChange("amount", e.target.value)}
            inputProps={{ step: "0.01", min: 0.01 }}
            required
            sx={{ mt: 2 }}
          />

          <TextField
            label="Fecha"
            type="date"
            fullWidth
            value={formData.expense_date}
            onChange={(e) => onChange("expense_date", e.target.value)}
            InputLabelProps={{ shrink: true }}
            required
            sx={{ mt: 2 }}
          />

          <TextField
            label="Descripción"
            fullWidth
            multiline
            minRows={2}
            value={formData.description}
            onChange={(e) => onChange("description", e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!formData.amount || Number(formData.amount) <= 0}
          >
            {isEditing ? "Guardar" : "Registrar"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
