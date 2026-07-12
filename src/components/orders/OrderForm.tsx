import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Autocomplete,
} from "@mui/material";
import { OrderFormData, Product } from "@/types";
import { useState, useEffect } from "react";

interface OrderFormProps {
  open: boolean;
  isEditing: boolean;
  formData: OrderFormData;
  onClose: () => void;
  onSubmit: (data: OrderFormData) => void;
  onChange: (field: keyof OrderFormData, value: unknown) => void;
}

export function OrderForm({
  open,
  isEditing,
  formData,
  onClose,
  onSubmit,
  onChange,
}: OrderFormProps) {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products");
        const data = await response.json();
        if (!response.ok) {
          console.error("Error al cargar productos:", data);
          setProducts([]);
        } else if (Array.isArray(data)) {
          setProducts(data);
        } else {
          console.error("Respuesta inesperada del servidor al cargar productos:", data);
          setProducts([]);
        }
      } catch (error) {
        console.error("Error al cargar productos:", error);
      }
    };
    if (open) {
      fetchProducts();
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const selectedProducts = products.filter((p) =>
    formData.product_ids.includes(p.product_id)
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {isEditing ? "Editar solicitud" : "Reportar producto faltante"}
        </DialogTitle>
        <DialogContent>
          <Autocomplete
            multiple
            options={products}
            value={selectedProducts}
            onChange={(_, value) =>
              onChange(
                "product_ids",
                value.map((p) => p.product_id)
              )
            }
            getOptionLabel={(option) =>
              [option.name, option.laboratory, option.concentration]
                .filter(Boolean)
                .join(" - ")
            }
            isOptionEqualToValue={(option, value) => option.product_id === value.product_id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Productos que faltan"
                placeholder="Buscar producto…"
                required={formData.product_ids.length === 0}
              />
            )}
            sx={{ mt: 1 }}
          />

          <TextField
            label="Nota (opcional)"
            placeholder='Ej: "quedan 2 cajas", "pedir presentación de 500 mg"'
            fullWidth
            multiline
            minRows={2}
            value={formData.note}
            onChange={(e) => onChange("note", e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={formData.product_ids.length === 0}
          >
            {isEditing ? "Guardar" : "Registrar"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
