"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/SettingsOutlined";
import { PageHeader } from "@/components/layout/PageHeader";
import { fluidFontSize } from "@/utils/fluidType";
import { ConfiguracionFormData, DEFAULT_THRESHOLDS } from "@/types/configuracion";

export default function ConfiguracionPage() {
  const [form, setForm] = useState<ConfiguracionFormData>(DEFAULT_THRESHOLDS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [severity, setSeverity] = useState<"success" | "error">("success");

  const fetchConfiguracion = async () => {
    try {
      const response = await fetch("/api/configuracion");
      const data = await response.json();
      if (response.ok) {
        setForm({
          low_stock_threshold: data.low_stock_threshold,
          expiry_alert_days: data.expiry_alert_days,
          validation_due_day: data.validation_due_day,
        });
      }
    } catch (error) {
      console.error("Error al cargar configuración:", error);
      setSnackbarMessage("Error al cargar la configuración");
      setSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfiguracion();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/configuracion", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al guardar la configuración");
      }

      setSnackbarMessage("Configuración guardada exitosamente");
      setSeverity("success");
    } catch (error) {
      console.error("Error:", error);
      setSnackbarMessage(
        `Error al guardar la configuración: ${(error as Error).message}`
      );
      setSeverity("error");
    } finally {
      setSaving(false);
      setOpenSnackbar(true);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <Paper sx={{ p: { xs: 2, sm: 3 }, maxWidth: 600, mx: "auto" }}>
        <PageHeader
          title="Configuración del Sistema"
          subtitle="Parámetros generales de operación"
          icon={<SettingsIcon />}
        />

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Umbral de bajo stock"
            type="number"
            value={form.low_stock_threshold}
            onChange={(e) =>
              setForm((f) => ({ ...f, low_stock_threshold: Number(e.target.value) }))
            }
            required
            disabled={saving}
            helperText="Cantidad disponible igual o menor a esta se considera 'bajo stock'. Valor por defecto: cada producto puede tener su propio umbral desde Productos"
            sx={{ mb: 3 }}
            slotProps={{ htmlInput: { min: 0 } }}
          />

          <TextField
            fullWidth
            label="Días de anticipación para alerta de vencimiento"
            type="number"
            value={form.expiry_alert_days}
            onChange={(e) =>
              setForm((f) => ({ ...f, expiry_alert_days: Number(e.target.value) }))
            }
            required
            disabled={saving}
            helperText="Lotes que vencen dentro de estos días se consideran 'próximos a vencer'. Valor por defecto: cada lote puede tener sus propios días desde Inventario"
            sx={{ mb: 3 }}
            slotProps={{ htmlInput: { min: 0 } }}
          />

          <TextField
            fullWidth
            label="Día del mes límite para validar el inventario"
            type="number"
            value={form.validation_due_day}
            onChange={(e) =>
              setForm((f) => ({ ...f, validation_due_day: Number(e.target.value) }))
            }
            required
            disabled={saving}
            helperText="Cada área se cuenta una vez al mes: al día 1 quedan todas pendientes y pasado este día se marcan fuera de plazo (10 = primeros diez días)"
            sx={{ mb: 3 }}
            slotProps={{ htmlInput: { min: 1, max: 28 } }}
          />

          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            sx={{
              mt: 2,
              fontSize: fluidFontSize(0.75, 0.875),
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            {saving ? "Guardando..." : "Guardar Configuración"}
          </Button>
        </form>
      </Paper>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={severity}
          onClose={() => setOpenSnackbar(false)}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
