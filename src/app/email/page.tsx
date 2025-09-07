"use client";

import { useState } from "react";
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

export default function EmailPage() {
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [severity, setSeverity] = useState<"success" | "error">("success");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: email,
          subject,
          message,
          includePaymentLink: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar el correo");
      }

      setSnackbarMessage("Correo enviado exitosamente");
      setSeverity("success");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (error) {
      console.error("Error sending email:", error);
      setSnackbarMessage(
        `Error al enviar el correo: ${(error as Error).message}`
      );
      setSeverity("error");
    } finally {
      setLoading(false);
      setOpenSnackbar(true);
    }
  };

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <Paper sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
        <Typography variant="h4" gutterBottom>
          Enviar Correo
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            type="email"
            label="Correo Electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Asunto"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            disabled={loading}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Mensaje"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            multiline
            rows={4}
            disabled={loading}
            sx={{ mb: 3 }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Enviar Correo"
            )}
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
