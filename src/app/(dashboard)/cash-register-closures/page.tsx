"use client";
import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import SavingsIcon from "@mui/icons-material/SavingsOutlined";
import { CLOSURE_STATUS_LABELS } from "@/types";
import { useCashRegisterClosures } from "@/hooks/useCashRegisterClosures";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { PageHeader } from "@/components/layout/PageHeader";

export default function CashRegisterClosuresPage() {
  const { closures, isLoading, cancelClosure, error } = useCashRegisterClosures();
  const { user } = useCurrentUser();
  const isAdmin = user?.role === "admin";
  const [userFilter, setUserFilter] = useState<string>("all");
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const userOptions = useMemo(() => {
    const names = new Map<number, string>();
    closures.forEach((c) => {
      if (c.user_id !== null) names.set(c.user_id, c.user_name || `Usuario ${c.user_id}`);
    });
    return Array.from(names.entries());
  }, [closures]);

  const filtered = useMemo(() => {
    if (!isAdmin || userFilter === "all") return closures;
    return closures.filter((c) => String(c.user_id) === userFilter);
  }, [closures, isAdmin, userFilter]);

  const handleCancel = async (id: number) => {
    if (!window.confirm("¿Anular este cierre de caja? Las ventas incluidas quedarán disponibles de nuevo.")) {
      return;
    }
    setCancellingId(id);
    try {
      await cancelClosure(id);
      setSnackbar({ open: true, message: "Cierre de caja anulado", severity: "success" });
    } catch (err) {
      setSnackbar({ open: true, message: (err as Error).message, severity: "error" });
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <Box sx={{ width: "100%", height: "100%", p: { xs: 1, sm: 3 } }}>
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 4 }}>
        <PageHeader
          title="Cierres de caja"
          subtitle={isAdmin ? "Historial de cierres de todos los usuarios" : "Historial de tus cierres de caja"}
          icon={<SavingsIcon />}
        />

        {isAdmin && userOptions.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <TextField
              select
              label="Usuario"
              size="small"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="all">Todos</MenuItem>
              {userOptions.map(([id, name]) => (
                <MenuItem key={id} value={String(id)}>
                  {name}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        )}

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {isAdmin && (
                  <TableCell sx={{ bgcolor: "primary.light", color: "white", fontWeight: "bold" }}>Usuario</TableCell>
                )}
                <TableCell sx={{ bgcolor: "primary.light", color: "white", fontWeight: "bold" }}>Periodo</TableCell>
                <TableCell sx={{ bgcolor: "primary.light", color: "white", fontWeight: "bold" }}>Ventas</TableCell>
                <TableCell sx={{ bgcolor: "primary.light", color: "white", fontWeight: "bold" }}>Total</TableCell>
                <TableCell sx={{ bgcolor: "primary.light", color: "white", fontWeight: "bold" }}>Efectivo</TableCell>
                <TableCell sx={{ bgcolor: "primary.light", color: "white", fontWeight: "bold" }}>QR/Transf.</TableCell>
                <TableCell sx={{ bgcolor: "primary.light", color: "white", fontWeight: "bold" }}>Contado</TableCell>
                <TableCell sx={{ bgcolor: "primary.light", color: "white", fontWeight: "bold" }}>Diferencia</TableCell>
                <TableCell sx={{ bgcolor: "primary.light", color: "white", fontWeight: "bold" }}>Estado</TableCell>
                {isAdmin && (
                  <TableCell sx={{ bgcolor: "primary.light", color: "white", fontWeight: "bold" }}>Acciones</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((c) => {
                const diff = Number(c.cash_difference);
                return (
                  <TableRow key={c.closure_id} sx={{ "&:nth-of-type(even)": { bgcolor: "action.hover" } }}>
                    {isAdmin && <TableCell>{c.user_name || "—"}</TableCell>}
                    <TableCell>
                      {new Date(c.period_start).toLocaleDateString()} – {new Date(c.period_end).toLocaleString()}
                    </TableCell>
                    <TableCell>{c.sell_count}</TableCell>
                    <TableCell>${Number(c.total_amount).toFixed(2)}</TableCell>
                    <TableCell>${Number(c.total_efectivo).toFixed(2)}</TableCell>
                    <TableCell>${Number(c.total_qr_transferencia).toFixed(2)}</TableCell>
                    <TableCell>${Number(c.counted_cash).toFixed(2)}</TableCell>
                    <TableCell>
                      <Typography
                        component="span"
                        sx={{
                          fontWeight: 600,
                          color: diff === 0 ? "text.primary" : diff > 0 ? "info.main" : "error.main",
                        }}
                      >
                        {diff > 0 ? "+" : ""}${diff.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={CLOSURE_STATUS_LABELS[c.status]}
                        size="small"
                        color={c.status === "closed" ? "success" : "default"}
                      />
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        {c.status === "closed" && (
                          <Button
                            size="small"
                            color="error"
                            disabled={cancellingId === c.closure_id}
                            onClick={() => handleCancel(c.closure_id)}
                          >
                            Anular
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {!isLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 10 : 8}>
                    <Typography color="textSecondary" align="center" sx={{ py: 2 }}>
                      No hay cierres de caja registrados.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {error && (
          <Typography color="error" mt={2}>
            {error.message}
          </Typography>
        )}
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
