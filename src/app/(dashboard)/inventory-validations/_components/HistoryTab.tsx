"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import BuildIcon from "@mui/icons-material/Build";
import {
  InventoryArea,
  InventoryValidation,
  InventoryValidationWithItems,
  ValidationStatus,
  ValidationType,
  DISCREPANCY_REASON_LABELS,
} from "@/types";
import { useValidations } from "@/hooks/useValidations";
import { buildAreaOptions } from "@/utils/areaTree";
import { VALIDATION_ITEM_STATUS_LABELS, VALIDATION_TYPE_LABELS } from "@/utils/validationLabels";

const STATUS_LABELS: Record<ValidationStatus, string> = {
  in_progress: "En progreso",
  completed: "Completada",
  cancelled: "Cancelada",
};

interface HistoryTabProps {
  areas: InventoryArea[];
  onNotify: (message: string, severity: "success" | "error" | "info") => void;
}

export function HistoryTab({ areas, onNotify }: HistoryTabProps) {
  const { getAll, getSession, applyAdjustments } = useValidations();
  const [sessions, setSessions] = useState<InventoryValidation[]>([]);
  const [typeFilter, setTypeFilter] = useState<ValidationType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<ValidationStatus | "all">("all");
  const [areaFilter, setAreaFilter] = useState<number | "all">("all");
  const [detail, setDetail] = useState<InventoryValidationWithItems | null>(null);
  const [applyingId, setApplyingId] = useState<number | null>(null);

  const load = async () => {
    const data = await getAll();
    setSessions(data.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      if (typeFilter !== "all" && s.type !== typeFilter) return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (areaFilter !== "all" && s.area_id !== areaFilter) return false;
      return true;
    });
  }, [sessions, typeFilter, statusFilter, areaFilter]);

  const handleViewDetail = async (id: number) => {
    const session = await getSession(id);
    if (!session) {
      onNotify("Error al cargar el detalle de la validación", "error");
      return;
    }
    setDetail(session);
  };

  const handleApplyAdjustments = async (id: number) => {
    setApplyingId(id);
    const result = await applyAdjustments(id);
    setApplyingId(null);
    if (!result) {
      onNotify("Error al aplicar los ajustes de inventario", "error");
      return;
    }
    onNotify(
      `Ajustes aplicados: ${result.applied.length} lote(s) actualizados${
        result.skipped.length ? `, ${result.skipped.length} omitido(s)` : ""
      }.`,
      "success"
    );
    await load();
    if (detail?.validation_id === id) {
      setDetail(null);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
        <TextField
          select
          label="Tipo"
          size="small"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ValidationType | "all")}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="all">Todos</MenuItem>
          {(Object.keys(VALIDATION_TYPE_LABELS) as ValidationType[]).map((type) => (
            <MenuItem key={type} value={type}>
              {VALIDATION_TYPE_LABELS[type]}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Estado"
          size="small"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ValidationStatus | "all")}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="all">Todos</MenuItem>
          {(Object.keys(STATUS_LABELS) as ValidationStatus[]).map((status) => (
            <MenuItem key={status} value={status}>
              {STATUS_LABELS[status]}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Área"
          size="small"
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="all">Todas</MenuItem>
          {buildAreaOptions(areas).map(({ area, depth, label }) => (
            <MenuItem key={area.area_id} value={area.area_id} sx={{ pl: 2 + depth * 2 }}>
              {label}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ bgcolor: "primary.light", color: "white", fontWeight: "bold" }}>Tipo</TableCell>
              <TableCell sx={{ bgcolor: "primary.light", color: "white", fontWeight: "bold" }}>Área</TableCell>
              <TableCell sx={{ bgcolor: "primary.light", color: "white", fontWeight: "bold" }}>Estado</TableCell>
              <TableCell sx={{ bgcolor: "primary.light", color: "white", fontWeight: "bold" }}>Iniciado</TableCell>
              <TableCell sx={{ bgcolor: "primary.light", color: "white", fontWeight: "bold" }}>Completado</TableCell>
              <TableCell sx={{ bgcolor: "primary.light", color: "white", fontWeight: "bold" }}>Ajustes</TableCell>
              <TableCell sx={{ bgcolor: "primary.light", color: "white", fontWeight: "bold" }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((session) => (
              <TableRow key={session.validation_id} sx={{ "&:nth-of-type(even)": { bgcolor: "action.hover" } }}>
                <TableCell>{VALIDATION_TYPE_LABELS[session.type]}</TableCell>
                <TableCell>{session.area_name || "—"}</TableCell>
                <TableCell>
                  <Chip
                    label={STATUS_LABELS[session.status]}
                    size="small"
                    color={
                      session.status === "completed"
                        ? "success"
                        : session.status === "cancelled"
                        ? "default"
                        : "info"
                    }
                  />
                </TableCell>
                <TableCell>{new Date(session.started_at).toLocaleString()}</TableCell>
                <TableCell>{session.completed_at ? new Date(session.completed_at).toLocaleString() : "—"}</TableCell>
                <TableCell>
                  {session.status !== "completed" ? (
                    <Chip label="N/A" size="small" variant="outlined" />
                  ) : session.inventory_adjusted_at ? (
                    <Chip label="Aplicado" size="small" color="success" />
                  ) : (
                    <Chip label="Pendiente" size="small" color="warning" />
                  )}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Button size="small" onClick={() => handleViewDetail(session.validation_id)}>
                      Ver detalle
                    </Button>
                    <Button
                      size="small"
                      component="a"
                      href={`/api/inventory-validations/${session.validation_id}/export/excel`}
                      startIcon={<DownloadIcon />}
                    >
                      Excel
                    </Button>
                    <Button
                      size="small"
                      component="a"
                      href={`/api/inventory-validations/${session.validation_id}/export/pdf`}
                      startIcon={<DownloadIcon />}
                    >
                      PDF
                    </Button>
                    {session.status === "completed" && !session.inventory_adjusted_at && (
                      <Button
                        size="small"
                        color="secondary"
                        variant="contained"
                        startIcon={<BuildIcon />}
                        disabled={applyingId === session.validation_id}
                        onClick={() => handleApplyAdjustments(session.validation_id)}
                      >
                        Aplicar ajustes
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography color="textSecondary" align="center" sx={{ py: 2 }}>
                    No hay validaciones que coincidan con los filtros.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={detail !== null} onClose={() => setDetail(null)} maxWidth="md" fullWidth>
        <DialogTitle>
          {detail && `${VALIDATION_TYPE_LABELS[detail.type]}${detail.area_name ? ` — ${detail.area_name}` : ""}`}
        </DialogTitle>
        <DialogContent>
          {detail && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell>Lote</TableCell>
                    <TableCell>Cant. Sistema</TableCell>
                    <TableCell>Cant. Real</TableCell>
                    <TableCell>Vencimiento</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Motivo</TableCell>
                    <TableCell>Notas</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detail.items.map((item) => {
                    const expiryCorrected =
                      !!item.actual_expiry_date &&
                      item.actual_expiry_date.split("T")[0] !== (item.expiry_date?.split("T")[0] ?? null);
                    return (
                      <TableRow key={item.validation_item_id}>
                        <TableCell>{item.product_name || "N/A"}</TableCell>
                        <TableCell>{item.batch_number || "N/A"}</TableCell>
                        <TableCell>{item.expected_quantity}</TableCell>
                        <TableCell>{item.actual_quantity ?? "—"}</TableCell>
                        <TableCell>
                          {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : "—"}
                          {expiryCorrected && (
                            <Typography variant="caption" color="error" display="block">
                              Real: {new Date(item.actual_expiry_date as string).toLocaleDateString()}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={VALIDATION_ITEM_STATUS_LABELS[item.status].label}
                            color={VALIDATION_ITEM_STATUS_LABELS[item.status].color}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {item.discrepancy_reason ? DISCREPANCY_REASON_LABELS[item.discrepancy_reason] : "—"}
                        </TableCell>
                        <TableCell>{item.notes || "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
