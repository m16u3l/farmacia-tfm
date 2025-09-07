"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
} from "@mui/material";

export default function ConfiguracionPage() {
  const [diasCobranza, setDiasCobranza] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [severity, setSeverity] = useState<"success" | "error">("success");

  useEffect(() => {
    fetchConfiguracion();
  }, []);

  const fetchConfiguracion = async () => {
    try {
      const response = await fetch("/api/configuracion");
      const data = await response.json();
      if (data.success) {
        setDiasCobranza(data.diasRestantes.toString());
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/configuracion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          diasRestantes: parseInt(diasCobranza),
        }),
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
      <Paper sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
        <Typography variant="h4" gutterBottom>
          Configuración del Sistema
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Días para Notificación de Cobranza"
            type="number"
            value={diasCobranza}
            onChange={(e) => setDiasCobranza(e.target.value)}
            required
            disabled={saving}
            helperText="Número de días antes del vencimiento para enviar notificaciones"
            sx={{ mb: 3 }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={saving}
          >
            {saving ? <CircularProgress size={24} /> : "Guardar Configuración"}
          </Button>
        </form>
      </Paper>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
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