"use client";
import { formatDate, formatDateTime } from "@/utils/dateUtils";
import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Alert,
  MenuItem,
  Snackbar,
  ChipProps,
  IconButton,
  Tooltip,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import VerifiedIcon from "@mui/icons-material/Verified";
import EditIcon from "@mui/icons-material/Edit";
import BuildIcon from "@mui/icons-material/Build";
import AddIcon from "@mui/icons-material/Add";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import LocationOffIcon from "@mui/icons-material/LocationOff";
import { AddValidationItemInput, Inventory, InventoryArea, InventoryValidation, InventoryValidationItem, InventoryValidationWithItems, Product, RemoveValidationItemInput, ValidationType, DiscrepancyReason } from "@/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { useConfirmDialog } from "@/components/common/ConfirmDialog";
import { useValidations } from "@/hooks/useValidations";
import { buildAreaOptions } from "@/utils/areaTree";
import { VALIDATION_ITEM_STATUS_LABELS, VALIDATION_TYPE_LABELS } from "@/utils/validationLabels";
import { VerifyItemDialog } from "./_components/VerifyItemDialog";
import { RemoveItemDialog } from "./_components/RemoveItemDialog";
import { AddItemDialog } from "./_components/AddItemDialog";
import { HistoryTab } from "./_components/HistoryTab";
import { CoverageTab } from "./_components/CoverageTab";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index} id={`inv-validation-tabpanel-${index}`}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function InventoryValidationsPage() {
  const [tabValue, setTabValue] = useState(0);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [areas, setAreas] = useState<InventoryArea[]>([]);
  const [validationType, setValidationType] = useState<ValidationType>("area");
  const [selectedValidationAreaId, setSelectedValidationAreaId] = useState<number | "">("");
  const [activeValidation, setActiveValidation] = useState<InventoryValidationWithItems | null>(null);
  const [reviewValidation, setReviewValidation] = useState<InventoryValidationWithItems | null>(null);
  const [resumeCandidates, setResumeCandidates] = useState<InventoryValidation[]>([]);
  const [openVerifyDialog, setOpenVerifyDialog] = useState(false);
  const [openRemoveDialog, setOpenRemoveDialog] = useState(false);
  const [openAddItemDialog, setOpenAddItemDialog] = useState(false);
  const [currentValidationItem, setCurrentValidationItem] = useState<InventoryValidationItem | null>(null);
  const [applyingAdjustments, setApplyingAdjustments] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info",
  });

  const { error, createSession, addItem, verifyItem, removeItem, completeSession, cancelSession, getAll, getSession, applyAdjustments } = useValidations();
  const { confirm, confirmDialog } = useConfirmDialog();
  const verificationMode = activeValidation !== null;

  const notify = (message: string, severity: "success" | "error" | "info") =>
    setSnackbar({ open: true, message, severity });

  // Reanuda cualquier validación 'in_progress' existente en la BD al montar la
  // página — de lo contrario, recargar o navegar fuera de la página durante una
  // validación activa la deja huérfana (sigue in_progress en la BD, pero la UI
  // pierde todo rastro de ella).
  const resumeInProgressSession = async () => {
    const inProgress = await getAll("in_progress");
    if (inProgress.length === 0) return;
    if (inProgress.length === 1) {
      const session = await getSession(inProgress[0].validation_id);
      if (session) {
        setActiveValidation(session);
        notify(`Se reanudó la validación en progreso iniciada el ${formatDateTime(session.started_at)}.`, "info");
      }
      return;
    }
    // Más de una sesión en progreso solo es posible por datos previos a esta
    // corrección — no elegir una silenciosamente, mostrar todas para que se
    // resuelvan explícitamente.
    setResumeCandidates(inProgress);
  };

  const handleResumeCandidate = async (id: number) => {
    const session = await getSession(id);
    if (!session) {
      notify("Error al reanudar la validación", "error");
      return;
    }
    setActiveValidation(session);
    setResumeCandidates((prev) => prev.filter((s) => s.validation_id !== id));
  };

  const fetchInventory = async () => {
    try {
      const response = await fetch("/api/inventory");
      const data = await response.json();
      if (!response.ok) {
        console.error("Error al cargar inventario:", data);
        setInventory([]);
      } else if (Array.isArray(data)) {
        setInventory(data);
      } else {
        console.error("Respuesta inesperada del servidor al cargar inventario:", data);
        setInventory([]);
      }
    } catch (error) {
      console.error("Error al cargar inventario:", error);
    }
  };

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

  const fetchAreas = async () => {
    try {
      const response = await fetch("/api/inventory-areas");
      const data = await response.json();
      if (!response.ok) {
        console.error("Error al cargar áreas:", data);
        setAreas([]);
      } else if (Array.isArray(data)) {
        setAreas(data);
      } else {
        console.error("Respuesta inesperada del servidor al cargar áreas:", data);
        setAreas([]);
      }
    } catch (error) {
      console.error("Error al cargar áreas:", error);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchProducts();
    fetchAreas();
    resumeInProgressSession();
  }, []);

  const getProductName = (productId: number) => {
    const product = products.find(p => p.product_id == productId);
    return product ? product.name : `${productId}`;
  };

  // Etiqueta breadcrumb del área ("Padre › Hija") — los nombres de área solos
  // suelen ser números de estante ("1", "6") y no identifican nada sin su padre.
  const getAreaLabel = (areaId: number | null | undefined, fallback?: string | null) => {
    const parts: string[] = [];
    let current = areas.find((a) => a.area_id === areaId);
    while (current) {
      parts.unshift(current.name);
      const parentId = current.parent_area_id;
      current = parentId ? areas.find((a) => a.area_id === parentId) : undefined;
    }
    return parts.length > 0 ? parts.join(" › ") : fallback || "";
  };

  // Estado combinado (vencimiento + stock) a partir de los valores crudos —
  // reutilizado tanto por `inventory` (dashboard) como por los ítems de una
  // sesión de validación (que snapshotean expiry_date/expected_quantity).
  const getStatus = (expiryDate: string | null | undefined, quantity: number) => {
    const days = getDaysUntilExpiry(expiryDate);
    const isExpired = typeof days === "number" && days < 0;
    const isAboutToExpire = typeof days === "number" && days >= 0 && days <= 40;
    const isLowStock = quantity <= 10;

    if (isExpired) return { status: "expired", label: "VENCIDO", color: "error" };
    if (isAboutToExpire) return { status: "expiring", label: "POR VENCER", color: "warning" };
    if (isLowStock) return { status: "low", label: "BAJO STOCK", color: "warning" };
    return { status: "ok", label: "OK", color: "success" };
  };

  const getInventoryStatus = (item: Inventory) => getStatus(item.expiry_date, item.quantity_available);

  // "2026-01-27T04:00:00.000Z" -> "2026-01-27", para comparar solo la fecha.
  const toDateOnly = (date: string | null | undefined) => (date ? date.split("T")[0] : null);

  const hasExpiryCorrection = (item: InventoryValidationItem) =>
    !!item.actual_expiry_date && toDateOnly(item.actual_expiry_date) !== toDateOnly(item.expiry_date);

  // Helper: returns number of days until expiry (can be negative), or null if no valid expiry date
  const getDaysUntilExpiry = (expiryDate: string | null | undefined): number | null => {
    if (!expiryDate) return null;
    const parsed = new Date(expiryDate);
    if (isNaN(parsed.getTime())) return null;
    const now = new Date();
    return Math.ceil((parsed.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleStartVerification = async () => {
    if (validationType === "area" && !selectedValidationAreaId) {
      notify("Selecciona un área para validar", "error");
      return;
    }

    const session = await createSession({
      type: validationType,
      area_id: validationType === "area" ? Number(selectedValidationAreaId) : undefined,
    });

    if (!session) {
      notify(error || "Error al iniciar la validación", "error");
      return;
    }

    setActiveValidation(session);
    notify(
      `Validación de "${VALIDATION_TYPE_LABELS[validationType]}" iniciada (${session.items.length} ítems). Verifique cada uno.`,
      "info"
    );
  };

  // Inicia una validación de área desde la pestaña Estado y salta a Validar.
  const handleStartAreaValidation = async (areaId: number) => {
    setValidationType("area");
    setSelectedValidationAreaId(areaId);
    setTabValue(0);

    const session = await createSession({ type: "area", area_id: areaId });
    if (!session) {
      notify(error || "Error al iniciar la validación", "error");
      return;
    }

    setActiveValidation(session);
    notify(
      `Validación de "${VALIDATION_TYPE_LABELS.area}" iniciada (${session.items.length} ítems). Verifique cada uno.`,
      "info"
    );
  };

  const handleAddItem = async (data: AddValidationItemInput) => {
    if (!activeValidation) return;

    const newItem = await addItem(activeValidation.validation_id, data);
    if (!newItem) {
      notify(error || "Error al agregar el ítem a la validación", "error");
      return;
    }

    setActiveValidation({
      ...activeValidation,
      items: [...activeValidation.items, newItem],
    });
    setOpenAddItemDialog(false);
    notify(
      data.mode === "create"
        ? `${newItem.product_name || "Ítem"} agregado al inventario y a la validación`
        : `${newItem.product_name || "Ítem"} vinculado a la validación (reubicado a esta área)`,
      "success"
    );
    // El agregado creó un lote o reubicó uno existente — refrescar el listado.
    fetchInventory();
  };

  const handleOpenVerifyDialog = (item: InventoryValidationItem) => {
    setCurrentValidationItem(item);
    setOpenVerifyDialog(true);
  };

  const handleVerifyItem = async (data: {
    actual_quantity: number;
    actual_expiry_date: string | null;
    notes: string;
    discrepancy_reason: DiscrepancyReason | null;
  }) => {
    if (!currentValidationItem || !activeValidation) return;

    const updatedItem = await verifyItem(activeValidation.validation_id, currentValidationItem.validation_item_id, data);

    if (!updatedItem) {
      notify("Error al verificar el ítem", "error");
      return;
    }

    setActiveValidation({
      ...activeValidation,
      items: activeValidation.items.map((i) =>
        i.validation_item_id === updatedItem.validation_item_id ? { ...i, ...updatedItem } : i
      ),
    });

    notify(`${currentValidationItem.product_name || "Ítem"} verificado correctamente`, "success");

    setOpenVerifyDialog(false);
    setCurrentValidationItem(null);
  };

  const handleOpenRemoveDialog = (item: InventoryValidationItem) => {
    setCurrentValidationItem(item);
    setOpenRemoveDialog(true);
  };

  const handleRemoveItem = async (data: RemoveValidationItemInput) => {
    if (!currentValidationItem || !activeValidation) return;

    const updatedItem = await removeItem(
      activeValidation.validation_id,
      currentValidationItem.validation_item_id,
      data
    );

    if (!updatedItem) {
      notify(error || "Error al registrar el resultado", "error");
      return;
    }

    setActiveValidation({
      ...activeValidation,
      items: activeValidation.items.map((i) =>
        i.validation_item_id === updatedItem.validation_item_id ? { ...i, ...updatedItem } : i
      ),
    });

    notify(
      data.outcome === "moved"
        ? `${currentValidationItem.product_name || "Ítem"} reubicado a otra área`
        : `${currentValidationItem.product_name || "Ítem"} marcado como no encontrado`,
      "success"
    );

    setOpenRemoveDialog(false);
    setCurrentValidationItem(null);
    if (data.outcome === "moved") {
      // El lote cambió de área — refrescar el listado de inventario.
      fetchInventory();
    }
  };

  const handleFinishVerification = async () => {
    if (!activeValidation) return;
    const totalItems = activeValidation.items.length;
    const verifiedItems = activeValidation.items.filter((i) => i.status !== "pending").length;

    if (verifiedItems < totalItems) {
      const confirmed = await confirm({
        title: "Finalizar validación incompleta",
        message: `Solo has verificado ${verifiedItems} de ${totalItems} items. ¿Deseas finalizar de todos modos?`,
        confirmLabel: "Finalizar",
        confirmColor: "primary",
      });
      if (!confirmed) {
        return;
      }
    }

    const completed = await completeSession(activeValidation.validation_id);
    if (!completed) {
      notify("Error al finalizar la validación", "error");
      return;
    }

    notify(`Validación completada. ${verifiedItems} items verificados.`, "success");

    // No se limpia directamente: el ajuste de inventario es un paso explícito
    // y separado, revisado antes de escribir en `inventory`.
    setReviewValidation({ ...activeValidation, status: completed.status, completed_at: completed.completed_at });
    setActiveValidation(null);
  };

  const handleCancelVerification = async () => {
    if (!activeValidation) return;
    const verifiedItems = activeValidation.items.filter((i) => i.status !== "pending").length;

    if (verifiedItems > 0) {
      const confirmed = await confirm({
        title: "Cancelar validación",
        message: "¿Deseas cancelar la validación? Se perderán todos los datos.",
        confirmLabel: "Cancelar validación",
      });
      if (!confirmed) {
        return;
      }
    }

    await cancelSession(activeValidation.validation_id);
    setActiveValidation(null);
  };

  const handleApplyAdjustments = async () => {
    if (!reviewValidation) return;
    setApplyingAdjustments(true);
    const result = await applyAdjustments(reviewValidation.validation_id);
    setApplyingAdjustments(false);

    if (!result) {
      notify(error || "Error al aplicar los ajustes de inventario", "error");
      return;
    }

    notify(
      `Ajustes aplicados: ${result.applied.length} lote(s) actualizados${
        result.skipped.length ? `, ${result.skipped.length} omitido(s)` : ""
      }.`,
      "success"
    );
    setReviewValidation(null);
    fetchInventory();
  };

  const handleCloseReviewWithoutAdjusting = () => {
    setReviewValidation(null);
  };

  const handleExportVerification = () => {
    if (!activeValidation) return;
    const csvContent = [
      [
        "Producto",
        "Lote",
        "Cantidad Sistema",
        "Cantidad Real",
        "Diferencia",
        "Vencimiento Sistema",
        "Vencimiento Real",
        "Notas",
        "Estado",
        "Fecha",
      ],
      ...activeValidation.items.map((item) => {
        const difference = (item.actual_quantity ?? 0) - item.expected_quantity;
        return [
          item.product_name || "N/A",
          item.batch_number || "N/A",
          item.expected_quantity,
          item.actual_quantity ?? "N/A",
          item.actual_quantity !== null ? difference : "N/A",
          item.expiry_date ? formatDate(item.expiry_date) : "N/A",
          hasExpiryCorrection(item) ? formatDate(item.actual_expiry_date as string) : "N/A",
          item.notes || "N/A",
          VALIDATION_ITEM_STATUS_LABELS[item.status].label,
          item.verified_at ? formatDateTime(item.verified_at) : "N/A",
        ];
      }),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `auditoria-inventario-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
  };

  const handleExportInventory = () => {
    const csvContent = [
      ["Producto", "Lote", "Cantidad", "Vencimiento", "Estado"],
      ...inventory.map((item) => {
        const status = getInventoryStatus(item);
        return [
          getProductName(item.product_id),
          item.batch_number || "N/A",
          item.quantity_available,
          item.expiry_date
            ? formatDate(item.expiry_date)
            : "N/A",
          status.label,
        ];
      }),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-inventario-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
  };

  const inventoryStats = {
    total: inventory.length,
    ok: inventory.filter((item) => getInventoryStatus(item).status === "ok").length,
    // Low stock should be counted regardless of expiry status
    lowStock: inventory.filter((item) => item.quantity_available <= 10).length,
    // Use days util to determine expiry states to avoid double-calling getInventoryStatus
    expiring: inventory.filter((item) => {
      const days = getDaysUntilExpiry(item.expiry_date);
      return typeof days === "number" && days >= 0 && days <= 40;
    }).length,
    expired: inventory.filter((item) => {
      const days = getDaysUntilExpiry(item.expiry_date);
      return typeof days === "number" && days < 0;
    }).length,
  };

  const discrepancyItems = reviewValidation
    ? reviewValidation.items.filter(
        (i) => i.status === "inconsistent" || i.status === "not_found" || hasExpiryCorrection(i)
      )
    : [];

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <PageHeader
          title="Validación de Inventario"
          subtitle="Verificación física por área, vencimiento próximo, vencido y bajo stock"
          icon={<FactCheckOutlinedIcon />}
        />

        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Validar" />
            <Tab label="Estado" />
            <Tab label="Historial" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {resumeCandidates.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography sx={{ mb: 1 }}>
                Hay {resumeCandidates.length} validaciones en progreso simultáneas. Elige cuál reanudar; las demás
                deberán cancelarse o completarse luego desde el Historial.
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {resumeCandidates.map((s) => (
                  <Button
                    key={s.validation_id}
                    size="small"
                    variant="outlined"
                    onClick={() => handleResumeCandidate(s.validation_id)}
                    disabled={verificationMode}
                  >
                    Reanudar {VALIDATION_TYPE_LABELS[s.type]}
                    {s.area_id ? ` — ${getAreaLabel(s.area_id, s.area_name)}` : ""} ({formatDate(s.started_at)})
                  </Button>
                ))}
              </Box>
            </Alert>
          )}

          {reviewValidation && (
            <Alert severity={discrepancyItems.length > 0 ? "warning" : "success"} sx={{ mb: 2 }}>
              <Typography sx={{ mb: 1 }}>
                <strong>Validación completada — revisión de inconsistencias: </strong>
                {discrepancyItems.length > 0
                  ? `${discrepancyItems.length} ítem(s) con diferencias respecto al sistema.`
                  : "No se encontraron inconsistencias."}
              </Typography>

              {discrepancyItems.length > 0 && (
                <TableContainer sx={{ mb: 2, maxHeight: 300 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Producto</TableCell>
                        <TableCell>Lote</TableCell>
                        <TableCell>Sistema</TableCell>
                        <TableCell>Real</TableCell>
                        <TableCell>Vencimiento</TableCell>
                        <TableCell>Estado</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {discrepancyItems.map((item) => (
                        <TableRow key={item.validation_item_id}>
                          <TableCell>{item.product_name || "N/A"}</TableCell>
                          <TableCell>{item.batch_number || "N/A"}</TableCell>
                          <TableCell>{item.expected_quantity}</TableCell>
                          <TableCell>{item.actual_quantity ?? "—"}</TableCell>
                          <TableCell>
                            {hasExpiryCorrection(item) ? (
                              <>
                                {formatDate(item.expiry_date as string)} →{" "}
                                <strong>{formatDate(item.actual_expiry_date as string)}</strong>
                              </>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={VALIDATION_ITEM_STATUS_LABELS[item.status].label}
                              color={VALIDATION_ITEM_STATUS_LABELS[item.status].color}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {discrepancyItems.length > 0 && (
                  <Button
                    variant="contained"
                    color="secondary"
                    size="small"
                    startIcon={<BuildIcon />}
                    onClick={handleApplyAdjustments}
                    disabled={applyingAdjustments}
                  >
                    Aplicar ajustes al inventario
                  </Button>
                )}
                <Button
                  size="small"
                  component="a"
                  href={`/api/inventory-validations/${reviewValidation.validation_id}/export/excel`}
                  startIcon={<DownloadIcon />}
                >
                  Excel
                </Button>
                <Button
                  size="small"
                  component="a"
                  href={`/api/inventory-validations/${reviewValidation.validation_id}/export/pdf`}
                  startIcon={<DownloadIcon />}
                >
                  PDF
                </Button>
                <Button size="small" variant="text" onClick={handleCloseReviewWithoutAdjusting}>
                  Cerrar sin ajustar
                </Button>
              </Box>
            </Alert>
          )}

          <Box sx={{ mb: 3, mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={2.4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Total Items
                    </Typography>
                    <Typography variant="h4">{inventoryStats.total}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <Card sx={{ bgcolor: "success.light" }}>
                  <CardContent>
                    <Typography color="white" gutterBottom variant="body2">
                      ✓ OK
                    </Typography>
                    <Typography variant="h4" color="white">
                      {inventoryStats.ok}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <Card sx={{ bgcolor: "warning.light" }}>
                  <CardContent>
                    <Typography color="white" gutterBottom variant="body2">
                      ⚠ Bajo Stock
                    </Typography>
                    <Typography variant="h4" color="white">
                      {inventoryStats.lowStock}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <Card sx={{ bgcolor: "warning.main" }}>
                  <CardContent>
                    <Typography color="white" gutterBottom variant="body2">
                      📅 Por Vencer
                    </Typography>
                    <Typography variant="h4" color="white">
                      {inventoryStats.expiring}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <Card sx={{ bgcolor: "error.main" }}>
                  <CardContent>
                    <Typography color="white" gutterBottom variant="body2">
                      🚨 Vencidos
                    </Typography>
                    <Typography variant="h4" color="white">
                      {inventoryStats.expired}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>

          {verificationMode && activeValidation && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography>
                  <strong>Validación activa: </strong>{" "}
                  {VALIDATION_TYPE_LABELS[activeValidation.type]}
                  {activeValidation.area_id
                    ? ` — ${getAreaLabel(activeValidation.area_id, activeValidation.area_name)}`
                    : ""}{" "}
                  -{" "}
                  {activeValidation.items.filter((i) => i.status !== "pending").length} de{" "}
                  {activeValidation.items.length} items verificados
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {activeValidation.type === "area" && (
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenAddItemDialog(true)}
                  >
                    Agregar ítem
                  </Button>
                )}
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={handleExportVerification}
                >
                  Exportar para auditar
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  onClick={handleFinishVerification}
                >
                  Finalizar
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={handleCancelVerification}
                >
                  Cancelar
                </Button>
              </Box>
            </Alert>
          )}

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mb: 2,
              gap: 2,
              flexWrap: "wrap",
              alignItems: "flex-end",
            }}
          >
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "flex-end" }}>
              <TextField
                select
                label="Tipo de validación"
                size="small"
                value={validationType}
                onChange={(e) => setValidationType(e.target.value as ValidationType)}
                disabled={verificationMode}
                sx={{ minWidth: 200 }}
              >
                {(Object.keys(VALIDATION_TYPE_LABELS) as ValidationType[]).map((type) => (
                  <MenuItem key={type} value={type}>
                    {VALIDATION_TYPE_LABELS[type]}
                  </MenuItem>
                ))}
              </TextField>
              {validationType === "area" && (
                <TextField
                  select
                  label="Área"
                  size="small"
                  value={selectedValidationAreaId}
                  onChange={(e) => setSelectedValidationAreaId(e.target.value ? Number(e.target.value) : "")}
                  disabled={verificationMode}
                  sx={{ minWidth: 220 }}
                >
                  {buildAreaOptions(areas).map(({ area, depth, label }) => (
                    <MenuItem key={area.area_id} value={area.area_id} sx={{ pl: 2 + depth * 2 }}>
                      {label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
              <Button
                variant="contained"
                color="secondary"
                startIcon={<VerifiedIcon />}
                onClick={handleStartVerification}
                disabled={verificationMode}
              >
                Iniciar Validación
              </Button>
            </Box>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleExportInventory}
            >
              Exportar CSV
            </Button>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: "primary.light", color: "white", fontWeight: "bold" }}>
                    Producto
                  </TableCell>
                  <TableCell sx={{ bgcolor: "primary.light", color: "white", fontWeight: "bold" }}>
                    Lote
                  </TableCell>
                  <TableCell sx={{ bgcolor: "primary.light", color: "white", fontWeight: "bold" }}>
                    Cantidad
                  </TableCell>
                  <TableCell sx={{ bgcolor: "primary.light", color: "white", fontWeight: "bold" }}>
                    Vencimiento
                  </TableCell>
                  <TableCell sx={{ bgcolor: "primary.light", color: "white", fontWeight: "bold" }}>
                    Estado
                  </TableCell>
                  {verificationMode && (
                    <TableCell sx={{ bgcolor: "primary.light", color: "white", fontWeight: "bold" }}>
                      Estado Validación
                    </TableCell>
                  )}
                  {verificationMode && (
                    <TableCell sx={{ bgcolor: "primary.light", color: "white", fontWeight: "bold" }}>
                      Acción
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {!verificationMode &&
                  inventory.map((item) => {
                    const status = getInventoryStatus(item);
                    return (
                      <TableRow
                        key={item.inventory_id}
                        sx={{
                          "&:nth-of-type(even)": { bgcolor: "action.hover" },
                          bgcolor: status.status === "expired" ? "error.light" : "inherit",
                        }}
                      >
                        <TableCell>{getProductName(item.product_id)}</TableCell>
                        <TableCell>{item.batch_number || "N/A"}</TableCell>
                        <TableCell>
                          <Typography
                            sx={{
                              color: item.quantity_available <= 10 ? "warning.main" : "inherit",
                              fontWeight: item.quantity_available <= 10 ? "bold" : "normal",
                            }}
                          >
                            {item.quantity_available}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {item.expiry_date
                            ? formatDate(item.expiry_date)
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={status.label}
                            color={status.color as ChipProps["color"]}
                            size="small"
                            sx={{ fontWeight: "bold" }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                {verificationMode &&
                  activeValidation &&
                  activeValidation.items.map((item) => {
                    const status = getStatus(
                      item.actual_expiry_date ?? item.expiry_date,
                      item.actual_quantity ?? item.expected_quantity
                    );
                    const statusInfo = VALIDATION_ITEM_STATUS_LABELS[item.status];

                    return (
                      <TableRow
                        key={item.validation_item_id}
                        sx={{
                          "&:nth-of-type(even)": { bgcolor: "action.hover" },
                          bgcolor: status.status === "expired" ? "error.light" : "inherit",
                        }}
                      >
                        <TableCell>{item.product_name || "N/A"}</TableCell>
                        <TableCell>{item.batch_number || "N/A"}</TableCell>
                        <TableCell>
                          <Box>
                            <Typography
                              sx={{
                                color: item.expected_quantity <= 10 ? "warning.main" : "inherit",
                                fontWeight: item.expected_quantity <= 10 ? "bold" : "normal",
                              }}
                            >
                              {item.expected_quantity}
                            </Typography>
                            {item.actual_quantity !== null && item.actual_quantity !== item.expected_quantity && (
                              <Typography variant="caption" color="error">
                                Real: {item.actual_quantity} (Dif:{" "}
                                {item.actual_quantity - item.expected_quantity})
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {item.expiry_date
                            ? formatDate(item.expiry_date)
                            : "N/A"}
                          {hasExpiryCorrection(item) && (
                            <Typography variant="caption" color="error" display="block">
                              Real: {formatDate(item.actual_expiry_date as string)}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={status.label}
                            color={status.color as ChipProps["color"]}
                            size="small"
                            sx={{ fontWeight: "bold" }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={statusInfo.label}
                            color={statusInfo.color}
                            size="small"
                            variant={item.status === "pending" ? "outlined" : "filled"}
                            sx={{ fontWeight: "bold" }}
                          />
                        </TableCell>
                        <TableCell>
                          {/* Un ítem 'added' nace verificado (el lote ya se creó con la
                              cantidad contada) — no se re-verifica desde aquí. */}
                          {item.status === "added" ? (
                            "—"
                          ) : (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <Button
                                variant={item.status !== "pending" ? "outlined" : "contained"}
                                size="small"
                                color={item.status !== "pending" ? "success" : "primary"}
                                onClick={() => handleOpenVerifyDialog(item)}
                                startIcon={item.status !== "pending" ? <EditIcon /> : <VerifiedIcon />}
                              >
                                {item.status !== "pending" ? "Editar" : "Verificar"}
                              </Button>
                              <Tooltip title="El producto ya no está en esta área">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleOpenRemoveDialog(item)}
                                >
                                  <LocationOffIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <CoverageTab
            areas={areas}
            verificationMode={verificationMode}
            onStartValidation={handleStartAreaValidation}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <HistoryTab areas={areas} onNotify={notify} />
        </TabPanel>
      </Paper>

      <VerifyItemDialog
        open={openVerifyDialog}
        item={currentValidationItem}
        onClose={() => setOpenVerifyDialog(false)}
        onSubmit={handleVerifyItem}
      />

      <RemoveItemDialog
        open={openRemoveDialog}
        item={currentValidationItem}
        areas={areas}
        currentAreaId={activeValidation?.area_id}
        onClose={() => setOpenRemoveDialog(false)}
        onSubmit={handleRemoveItem}
      />

      {activeValidation?.type === "area" && (
        <AddItemDialog
          open={openAddItemDialog}
          areaName={activeValidation.area_name || "área en validación"}
          products={products}
          inventory={inventory}
          existingInventoryIds={activeValidation.items
            .map((i) => i.inventory_id)
            .filter((id): id is number => id !== null)}
          onClose={() => setOpenAddItemDialog(false)}
          onSubmit={handleAddItem}
        />
      )}

      {confirmDialog}

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
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
