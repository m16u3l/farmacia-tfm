"use client";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Snackbar,
  ChipProps,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import VerifiedIcon from "@mui/icons-material/Verified";
import EditIcon from "@mui/icons-material/Edit";
import AssessmentIcon from "@mui/icons-material/AssessmentOutlined";
import { Inventory, InventoryArea, InventoryValidationItem, InventoryValidationWithItems, Product, ValidationType } from "@/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { useValidations } from "@/hooks/useValidations";
import { buildAreaOptions } from "@/utils/areaTree";

const VALIDATION_TYPE_LABELS: Record<ValidationType, string> = {
  area: "Por área/ubicación",
  expiring: "Próximos a vencer",
  expired: "Vencidos",
  low_stock: "Bajo stock",
};

const VALIDATION_ITEM_STATUS_LABELS: Record<InventoryValidationItem["status"], { label: string; color: "default" | "success" | "warning" | "error" }> = {
  pending: { label: "PENDIENTE", color: "default" },
  confirmed: { label: "VERIFICADO OK", color: "success" },
  inconsistent: { label: "INCONSISTENCIA", color: "warning" },
  not_found: { label: "NO ENCONTRADO", color: "error" },
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`validation-tabpanel-${index}`}
      aria-labelledby={`validation-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface DailySales {
  date: string;
  total_sales: number;
  total_amount: number;
  products_sold: number;
}

interface MonthlySales {
  month: string;
  year: number;
  total_sales: number;
  total_amount: number;
  products_sold: number;
}

export default function ValidationsPage() {
  const [tabValue, setTabValue] = useState(0);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [areas, setAreas] = useState<InventoryArea[]>([]);
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [monthlySales, setMonthlySales] = useState<MonthlySales[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  // loading state removed (not used in UI)
  const [validationType, setValidationType] = useState<ValidationType>("area");
  const [selectedValidationAreaId, setSelectedValidationAreaId] = useState<number | "">("");
  const [activeValidation, setActiveValidation] = useState<InventoryValidationWithItems | null>(null);
  const [openVerifyDialog, setOpenVerifyDialog] = useState(false);
  const [currentValidationItem, setCurrentValidationItem] = useState<InventoryValidationItem | null>(null);
  const [actualQuantity, setActualQuantity] = useState(0);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info",
  });

  const { createSession, verifyItem, completeSession, cancelSession } = useValidations();
  const verificationMode = activeValidation !== null;

  useEffect(() => {
    fetchInventory();
    fetchProducts();
    fetchAreas();
    fetchDailySales();
    fetchMonthlySales();
  }, []);

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

  const fetchDailySales = async () => {
    try {
      const response = await fetch("/api/sells");
      const data = await response.json();

      if (!response.ok) {
        console.error("Error al cargar ventas diarias:", data);
        setDailySales([]);
        return;
      }
      if (!Array.isArray(data)) {
        console.error("Respuesta inesperada al cargar ventas diarias:", data);
        setDailySales([]);
        return;
      }

      // Agrupar ventas por día
      const salesByDay: { [key: string]: DailySales } = {};

      data.forEach((sale: Record<string, unknown>) => {
        // Validar que la fecha sea válida
        if (!sale.sale_date) return;
        const saleDate = new Date(String(sale.sale_date));
        if (isNaN(saleDate.getTime())) return; // Saltar fechas inválidas
        
        const date = saleDate.toISOString().split("T")[0];

        if (!salesByDay[date]) {
          salesByDay[date] = {
            date,
            total_sales: 0,
            total_amount: 0,
            products_sold: 0,
          };
        }

        salesByDay[date].total_sales += 1;
        salesByDay[date].total_amount += parseFloat(String(sale.total_amount || 0));
        salesByDay[date].products_sold += parseInt(String(sale.quantity || 0));
      });

      const salesArray = Object.values(salesByDay).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setDailySales(salesArray);
    } catch (error) {
      console.error("Error al cargar ventas diarias:", error);
    }
  };

  const fetchMonthlySales = async () => {
    try {
      const response = await fetch("/api/sells");
      const data = await response.json();

      if (!response.ok) {
        console.error("Error al cargar ventas mensuales:", data);
        setMonthlySales([]);
        return;
      }
      if (!Array.isArray(data)) {
        console.error("Respuesta inesperada al cargar ventas mensuales:", data);
        setMonthlySales([]);
        return;
      }

      // Agrupar ventas por mes
      const salesByMonth: { [key: string]: MonthlySales } = {};

      data.forEach((sale: Record<string, unknown>) => {
        const date = new Date(String(sale.sale_date));
        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        if (!salesByMonth[monthKey]) {
          salesByMonth[monthKey] = {
            month: new Date(
              date.getFullYear(),
              date.getMonth(),
              1
            ).toLocaleDateString("es-ES", {
              month: "long",
              year: "numeric",
            }),
            year: date.getFullYear(),
            total_sales: 0,
            total_amount: 0,
            products_sold: 0,
          };
        }

        salesByMonth[monthKey].total_sales += 1;
        salesByMonth[monthKey].total_amount += parseFloat(String(sale.total_amount || 0));
        salesByMonth[monthKey].products_sold += parseInt(String(sale.quantity || 0));
      });

      const salesArray = Object.values(salesByMonth).sort(
        (a, b) => b.year - a.year
      );

      setMonthlySales(salesArray);
    } catch (error) {
      console.error("Error al cargar ventas mensuales:", error);
    }
  };

  const getProductName = (productId: number) => {
    const product = products.find(p => p.product_id == productId);
    return product ? product.name : `${productId}`;
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
      setSnackbar({ open: true, message: "Selecciona un área para validar", severity: "error" });
      return;
    }

    const session = await createSession({
      type: validationType,
      area_id: validationType === "area" ? Number(selectedValidationAreaId) : undefined,
    });

    if (!session) {
      setSnackbar({ open: true, message: "Error al iniciar la validación", severity: "error" });
      return;
    }

    setActiveValidation(session);
    setSnackbar({
      open: true,
      message: `Validación de "${VALIDATION_TYPE_LABELS[validationType]}" iniciada (${session.items.length} ítems). Verifique cada uno.`,
      severity: "info",
    });
  };

  const handleOpenVerifyDialog = (item: InventoryValidationItem) => {
    setCurrentValidationItem(item);
    setActualQuantity(item.actual_quantity ?? item.expected_quantity);
    setVerificationNotes(item.notes || "");
    setOpenVerifyDialog(true);
  };

  const handleVerifyItem = async () => {
    if (!currentValidationItem || !activeValidation) return;

    const updatedItem = await verifyItem(activeValidation.validation_id, currentValidationItem.validation_item_id, {
      actual_quantity: actualQuantity,
      notes: verificationNotes,
    });

    if (!updatedItem) {
      setSnackbar({ open: true, message: "Error al verificar el ítem", severity: "error" });
      return;
    }

    setActiveValidation({
      ...activeValidation,
      items: activeValidation.items.map((i) =>
        i.validation_item_id === updatedItem.validation_item_id ? { ...i, ...updatedItem } : i
      ),
    });

    setSnackbar({
      open: true,
      message: `${currentValidationItem.product_name || "Ítem"} verificado correctamente`,
      severity: "success",
    });

    setOpenVerifyDialog(false);
    setCurrentValidationItem(null);
    setActualQuantity(0);
    setVerificationNotes("");
  };

  const handleFinishVerification = async () => {
    if (!activeValidation) return;
    const totalItems = activeValidation.items.length;
    const verifiedItems = activeValidation.items.filter((i) => i.status !== "pending").length;

    if (verifiedItems < totalItems) {
      if (
        !window.confirm(
          `Solo has verificado ${verifiedItems} de ${totalItems} items. ¿Deseas finalizar de todos modos?`
        )
      ) {
        return;
      }
    }

    const completed = await completeSession(activeValidation.validation_id);
    if (!completed) {
      setSnackbar({ open: true, message: "Error al finalizar la validación", severity: "error" });
      return;
    }

    setSnackbar({
      open: true,
      message: `Validación completada. ${verifiedItems} items verificados.`,
      severity: "success",
    });

    setActiveValidation(null);
  };

  const handleCancelVerification = async () => {
    if (!activeValidation) return;
    const verifiedItems = activeValidation.items.filter((i) => i.status !== "pending").length;

    if (verifiedItems > 0) {
      if (
        !window.confirm(
          "¿Deseas cancelar la validación? Se perderán todos los datos."
        )
      ) {
        return;
      }
    }

    await cancelSession(activeValidation.validation_id);
    setActiveValidation(null);
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
          item.notes || "N/A",
          VALIDATION_ITEM_STATUS_LABELS[item.status].label,
          item.verified_at ? new Date(item.verified_at).toLocaleString() : "N/A",
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
            ? new Date(item.expiry_date).toLocaleDateString()
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

  const handleExportDailySales = () => {
    const csvContent = [
      ["Fecha", "Total Ventas", "Monto Total", "Productos Vendidos"],
      ...dailySales.map((sale) => [
        new Date(sale.date).toLocaleDateString(),
        sale.total_sales,
        `$${sale.total_amount}`,
        sale.products_sold,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-ventas-diarias-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
  };

  const handleExportMonthlySales = () => {
    const csvContent = [
      ["Mes", "Total Ventas", "Monto Total", "Productos Vendidos"],
      ...monthlySales.map((sale) => [
        sale.month,
        sale.total_sales,
        `$${sale.total_amount}`,
        sale.products_sold,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-ventas-mensuales-${
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

  const filteredDailySales = dailySales.filter(
    (sale) => sale.date === selectedDate
  );
  // filteredMonthlySales unused; removed

  return (
    <Box sx={{ width: "100%", height: "100%", p: { xs: 1, sm: 3 } }}>
      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <PageHeader
          title="Validaciones y Reportes"
          subtitle="Estado del inventario y desempeño de ventas"
          icon={<AssessmentIcon />}
        />

        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Validación de Inventario" />
            <Tab label="Reporte Diario de Ventas" />
            <Tab label="Reporte Mensual de Ventas" />
          </Tabs>
        </Box>

        {/* TAB 1: Validación de Inventario */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={2.4}>
                <Card>
                  <CardContent>
                    <Typography
                      color="textSecondary"
                      gutterBottom
                      variant="body2"
                    >
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
                  {activeValidation.area_name ? ` — ${activeValidation.area_name}` : ""} -{" "}
                  {activeValidation.items.filter((i) => i.status !== "pending").length} de{" "}
                  {activeValidation.items.length} items verificados
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
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
                <TableRow sx={{ bgcolor: "primary.light" }}>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    Producto
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    Lote
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    Cantidad
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    Vencimiento
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    Estado
                  </TableCell>
                  {verificationMode && (
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                      Estado Validación
                    </TableCell>
                  )}
                  {verificationMode && (
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>
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
                            ? new Date(item.expiry_date).toLocaleDateString()
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
                    const status = getStatus(item.expiry_date, item.actual_quantity ?? item.expected_quantity);
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
                            ? new Date(item.expiry_date).toLocaleDateString()
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
                          <Button
                            variant={item.status !== "pending" ? "outlined" : "contained"}
                            size="small"
                            color={item.status !== "pending" ? "success" : "primary"}
                            onClick={() => handleOpenVerifyDialog(item)}
                            startIcon={item.status !== "pending" ? <EditIcon /> : <VerifiedIcon />}
                          >
                            {item.status !== "pending" ? "Editar" : "Verificar"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* TAB 2: Reporte Diario de Ventas */}
        <TabPanel value={tabValue} index={1}>
          <Box
            sx={{
              mb: 3,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <TextField
              type="date"
              label="Seleccionar Fecha"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleExportDailySales}
            >
              Exportar CSV
            </Button>
          </Box>

          {filteredDailySales.length > 0 ? (
            <>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Total Ventas
                      </Typography>
                      <Typography variant="h4">
                        {filteredDailySales[0].total_sales}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Monto Total
                      </Typography>
                      <Typography variant="h4" color="primary">
                        ${filteredDailySales[0].total_amount}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Productos Vendidos
                      </Typography>
                      <Typography variant="h4">
                        {filteredDailySales[0].products_sold}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </>
          ) : (
            <Alert severity="info">
              No hay ventas registradas para esta fecha.
            </Alert>
          )}

          <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
            Historial de Ventas Diarias
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "primary.light" }}>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    Fecha
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    Total Ventas
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    Monto Total
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    Productos Vendidos
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dailySales.slice(0, 10).map((sale, index) => (
                  <TableRow
                    key={index}
                    sx={{ "&:nth-of-type(even)": { bgcolor: "action.hover" } }}
                  >
                    <TableCell>
                      {new Date(sale.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{sale.total_sales}</TableCell>
                    <TableCell>
                      <Typography color="primary" fontWeight="bold">
                        ${sale.total_amount}
                      </Typography>
                    </TableCell>
                    <TableCell>{sale.products_sold}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* TAB 3: Reporte Mensual de Ventas */}
        <TabPanel value={tabValue} index={2}>
          <Box
            sx={{
              mb: 3,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <TextField
              type="month"
              label="Seleccionar Mes"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleExportMonthlySales}
            >
              Exportar CSV
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "primary.light" }}>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    Mes
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    Total Ventas
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    Monto Total
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    Productos Vendidos
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {monthlySales.map((sale, index) => (
                  <TableRow
                    key={index}
                    sx={{ "&:nth-of-type(even)": { bgcolor: "action.hover" } }}
                  >
                    <TableCell sx={{ textTransform: "capitalize" }}>
                      {sale.month}
                    </TableCell>
                    <TableCell>{sale.total_sales}</TableCell>
                    <TableCell>
                      <Typography color="primary" fontWeight="bold">
                        ${sale.total_amount}
                      </Typography>
                    </TableCell>
                    <TableCell>{sale.products_sold}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      {/* Diálogo de Verificación */}
      <Dialog
        open={openVerifyDialog}
        onClose={() => setOpenVerifyDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Verificar Item de Inventario</DialogTitle>
        <DialogContent>
          {currentValidationItem && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                {currentValidationItem.product_name || "N/A"}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Lote:</strong> {currentValidationItem.batch_number || "N/A"}
              </Typography>
              <Typography variant="body2" gutterBottom sx={{ mb: 2 }}>
                <strong>Cantidad en Sistema:</strong>{" "}
                {currentValidationItem.expected_quantity}
              </Typography>

              <TextField
                fullWidth
                type="number"
                label="Cantidad Real Contada"
                value={actualQuantity}
                onChange={(e) =>
                  setActualQuantity(parseInt(e.target.value) || 0)
                }
                margin="normal"
                inputProps={{ min: 0 }}
                helperText="Ingrese la cantidad física contada"
              />

              {actualQuantity !== currentValidationItem.expected_quantity && (
                <Alert
                  severity={
                    actualQuantity < currentValidationItem.expected_quantity
                      ? "warning"
                      : "info"
                  }
                  sx={{ mt: 2 }}
                >
                  Diferencia: {actualQuantity - currentValidationItem.expected_quantity}{" "}
                  unidades
                  {actualQuantity < currentValidationItem.expected_quantity
                    ? " (Faltante)"
                    : " (Sobrante)"}
                </Alert>
              )}

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notas de Verificación"
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                margin="normal"
                placeholder="Observaciones, razón de diferencias, etc."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenVerifyDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleVerifyItem}
            startIcon={<VerifiedIcon />}
          >
            Marcar como Verificado
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
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
