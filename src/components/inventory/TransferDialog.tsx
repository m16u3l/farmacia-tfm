import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Grid,
  Typography,
} from "@mui/material";
import { Inventory, InventoryArea } from "@/types";
import { buildAreaOptions } from "@/utils/areaTree";

interface TransferDialogProps {
  open: boolean;
  item: Inventory | null;
  areas: InventoryArea[];
  onClose: () => void;
  onSubmit: (data: { destination_area_id: number; quantity: number; notes?: string }) => void;
}

export function TransferDialog({ open, item, areas, onClose, onSubmit }: TransferDialogProps) {
  const [destinationAreaId, setDestinationAreaId] = useState<number | "">("");
  const [quantity, setQuantity] = useState<number>(0);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setDestinationAreaId("");
      setQuantity(0);
      setNotes("");
    }
  }, [open, item]);

  if (!item) return null;

  const areaOptions = buildAreaOptions(areas, item.area_id ?? undefined);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinationAreaId || quantity <= 0 || quantity > item.quantity_available) return;
    onSubmit({ destination_area_id: Number(destinationAreaId), quantity, notes: notes || undefined });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Transferir Inventario</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom sx={{ mb: 2 }}>
            <strong>Cantidad disponible:</strong> {item.quantity_available}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                select
                autoFocus
                label="Área Destino"
                fullWidth
                value={destinationAreaId}
                onChange={(e) => setDestinationAreaId(e.target.value ? Number(e.target.value) : "")}
                required
              >
                {areaOptions.map(({ area, depth, label }) => (
                  <MenuItem key={area.area_id} value={area.area_id} sx={{ pl: 2 + depth * 2 }}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Cantidad a Transferir"
                type="number"
                fullWidth
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                inputProps={{ min: 1, max: item.quantity_available }}
                required
                error={quantity > item.quantity_available}
                helperText={quantity > item.quantity_available ? "Supera la cantidad disponible" : ""}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Notas"
                fullWidth
                multiline
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={!destinationAreaId || quantity <= 0 || quantity > item.quantity_available}>
            Transferir
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
