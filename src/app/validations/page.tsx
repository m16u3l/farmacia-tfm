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
  Checkbox,
  IconButton,
  Snackbar,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import DownloadIcon from "@mui/icons-material/Download";
import VerifiedIcon from "@mui/icons-material/Verified";
import EditIcon from "@mui/icons-material/Edit";
import { Inventory, Product } from "@/types";

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

interface VerificationRecord {
  inventory_id: number;
  verified: boolean;
  actual_quantity: number;
  notes: string;
  verified_at?: string;
  verified_by?: string;
}

export default function ValidationsPage() {
  const [tabValue, setTabValue] = useState(0);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [monthlySales, setMonthlySales] = useState<MonthlySales[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [loading, setLoading] = useState(true);
  const [verificationMode, setVerificationMode] = useState(false);
  const [verificationRecords, setVerificationRecords] = useState<
    Map<number, VerificationRecord>
  >(new Map());
  const [openVerifyDialog, setOpenVerifyDialog] = useState(false);
  const [currentItem, setCurrentItem] = useState<Inventory | null>(null);
  const [actualQuantity, setActualQuantity] = useState(0);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info",
  });

  useEffect(() => {
    fetchInventory();
    fetchProducts();
    fetchDailySales();
    fetchMonthlySales();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await fetch("/api/inventory");
      const data = await response.json();
      setInventory(data);
      setLoading(false);
    } catch (error) {
      console.error("Error al cargar inventario:", error);
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error al cargar productos:", error);
    }
  };

  const fetchDailySales = async () => {
    try {
      const response = await fetch("/api/sells");
      const data = await response.json();

      // Agrupar ventas por día
      const salesByDay: { [key: string]: DailySales } = {};

      data.forEach((sale: any) => {
        // Validar que la fecha sea válida
        if (!sale.sale_date) return;
        
        const saleDate = new Date(sale.sale_date);
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
        salesByDay[date].total_amount += parseFloat(sale.total_amount || 0);
        salesByDay[date].products_sold += parseInt(sale.quantity || 0);
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

      // Agrupar ventas por mes
      const salesByMonth: { [key: string]: MonthlySales } = {};

      data.forEach((sale: any) => {
        const date = new Date(sale.sale_date);
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
        salesByMonth[monthKey].total_amount += parseFloat(
          sale.total_amount || 0
        );
        salesByMonth[monthKey].products_sold += parseInt(sale.quantity || 0);
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

  const getInventoryStatus = (item: Inventory) => {
    // Use helper functions below; kept simple here for readability.
    const days = getDaysUntilExpiry(item);
    const isExpired = typeof days === "number" && days < 0;
    const isAboutToExpire = typeof days === "number" && days >= 0 && days <= 40;
    const isLowStock = item.quantity_available <= 10;

    if (isExpired) return { status: "expired", label: "VENCIDO", color: "error" };
    if (isAboutToExpire) return { status: "expiring", label: "POR VENCER", color: "warning" };
    if (isLowStock) return { status: "low", label: "BAJO STOCK", color: "warning" };
    return { status: "ok", label: "OK", color: "success" };
  };

  // Helper: returns number of days until expiry (can be negative), or null if no valid expiry date
  const getDaysUntilExpiry = (item: Inventory): number | null => {
    if (!item.expiry_date) return null;
    const parsed = new Date(item.expiry_date);
    if (isNaN(parsed.getTime())) return null;
    const now = new Date();
    return Math.ceil((parsed.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleStartVerification = () => {
    setVerificationMode(true);
    setVerificationRecords(new Map());
    setSnackbar({
      open: true,
      message:
        "Modo de verificación activado. Verifique cada item del inventario.",
      severity: "info",
    });
  };

  const handleOpenVerifyDialog = (item: Inventory) => {
    setCurrentItem(item);
    const existingRecord = verificationRecords.get(item.inventory_id);
    setActualQuantity(
      existingRecord?.actual_quantity || item.quantity_available
    );
    setVerificationNotes(existingRecord?.notes || "");
    setOpenVerifyDialog(true);
  };

  const handleVerifyItem = () => {
    if (!currentItem) return;

    const record: VerificationRecord = {
      inventory_id: currentItem.inventory_id,
      verified: true,
      actual_quantity: actualQuantity,
      notes: verificationNotes,
      verified_at: new Date().toISOString(),
      verified_by: "Farmacéutico", // Aquí podrías usar el usuario actual
    };

    const newRecords = new Map(verificationRecords);
    newRecords.set(currentItem.inventory_id, record);
    setVerificationRecords(newRecords);

    setSnackbar({
      open: true,
      message: `${getProductName(
        currentItem.product_id
      )} verificado correctamente`,
      severity: "success",
    });

    setOpenVerifyDialog(false);
    setCurrentItem(null);
    setActualQuantity(0);
    setVerificationNotes("");
  };

  const handleFinishVerification = () => {
    const totalItems = inventory.length;
    const verifiedItems = verificationRecords.size;

    if (verifiedItems < totalItems) {
      if (
        !window.confirm(
          `Solo has verificado ${verifiedItems} de ${totalItems} items. ¿Deseas finalizar de todos modos?`
        )
      ) {
        return;
      }
    }

    // Aquí podrías guardar los registros en la base de datos
    const auditReport = Array.from(verificationRecords.values());
    console.log("Reporte de auditoría:", auditReport);

    setSnackbar({
      open: true,
      message: `Verificación completada. ${verifiedItems} items verificados.`,
      severity: "success",
    });

    setVerificationMode(false);
  };

  const handleCancelVerification = () => {
    if (verificationRecords.size > 0) {
      if (
        !window.confirm(
          "¿Deseas cancelar la verificación? Se perderán todos los datos."
        )
      ) {
        return;
      }
    }
    setVerificationMode(false);
    setVerificationRecords(new Map());
  };

  const handleExportVerification = () => {
    const csvContent = [
      [
        "Producto",
        "Lote",
        "Cantidad Sistema",
        "Cantidad Real",
        "Diferencia",
        "Notas",
        "Verificado Por",
        "Fecha",
      ],
      ...Array.from(verificationRecords.values()).map((record) => {
        const item = inventory.find(
          (i) => i.inventory_id === record.inventory_id
        );
        if (!item) return [];
        const difference = record.actual_quantity - item.quantity_available;
        return [
          getProductName(item.product_id),
          item.batch_number || "N/A",
          item.quantity_available,
          record.actual_quantity,
          difference,
          record.notes || "N/A",
          record.verified_by || "N/A",
          record.verified_at
            ? new Date(record.verified_at).toLocaleString()
            : "N/A",
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
      const days = getDaysUntilExpiry(item);
      return typeof days === "number" && days >= 0 && days <= 40;
    }).length,
    expired: inventory.filter((item) => {
      const days = getDaysUntilExpiry(item);
      return typeof days === "number" && days < 0;
    }).length,
  };

  const filteredDailySales = dailySales.filter(
    (sale) => sale.date === selectedDate
  );
  const filteredMonthlySales = monthlySales.filter((sale) =>
    sale.month.includes(selectedMonth)
  );

  return (
    <Box sx={{ width: "100%", height: "100%", p: { xs: 1, sm: 3 } }}>
      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography
          variant="h4"
          sx={{ mb: 3, fontSize: { xs: "1.5rem", sm: "2rem" } }}
        >
          Validaciones y Reportes
        </Typography>

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

          {verificationMode && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography>
                  <strong>Modo de Verificación Activo: </strong> -{" "}
                  {verificationRecords.size} de {inventory.length} items
                  verificados
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
            }}
          >
            <Button
              variant="contained"
              color="secondary"
              startIcon={<VerifiedIcon />}
              onClick={handleStartVerification}
              disabled={verificationMode}
            >
              Verificar Integridad de Inventario
            </Button>
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
                  {verificationMode && (
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                      ✓
                    </TableCell>
                  )}
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
                {inventory.map((item) => {
                  const status = getInventoryStatus(item);
                  const isVerified = verificationRecords.has(item.inventory_id);
                  const verificationRecord = verificationRecords.get(
                    item.inventory_id
                  );

                  return (
                    <TableRow
                      key={item.inventory_id}
                      sx={{
                        "&:nth-of-type(even)": { bgcolor: "action.hover" },
                        bgcolor:
                          status.status === "expired"
                            ? "error.light"
                            : "inherit",
                      }}
                    >
                      {verificationMode && (
                        <TableCell>
                          <Checkbox
                            checked={isVerified}
                            disabled
                            icon={<CheckCircleIcon />}
                            checkedIcon={<CheckCircleIcon color="success" />}
                          />
                        </TableCell>
                      )}
                      <TableCell>{getProductName(item.product_id)}</TableCell>
                      <TableCell>{item.batch_number || "N/A"}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography
                            sx={{
                              color:
                                item.quantity_available <= 10
                                  ? "warning.main"
                                  : "inherit",
                              fontWeight:
                                item.quantity_available <= 10
                                  ? "bold"
                                  : "normal",
                            }}
                          >
                            {item.quantity_available}
                          </Typography>
                          {isVerified &&
                            verificationRecord &&
                            verificationRecord.actual_quantity !==
                              item.quantity_available && (
                              <Typography variant="caption" color="error">
                                Real: {verificationRecord.actual_quantity} (Dif:{" "}
                                {verificationRecord.actual_quantity -
                                  item.quantity_available}
                                )
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
                          color={status.color as any}
                          size="small"
                          sx={{ fontWeight: "bold" }}
                        />
                      </TableCell>
                      {verificationMode && (
                        <TableCell>
                          {isVerified && verificationRecord ? (
                            verificationRecord.actual_quantity === 0 ? (
                              <Chip
                                label="NO ENCONTRADO"
                                color="error"
                                size="small"
                                sx={{ fontWeight: "bold" }}
                              />
                            ) : verificationRecord.actual_quantity !== item.quantity_available ? (
                              <Chip
                                label="INCONSISTENCIA"
                                color="warning"
                                size="small"
                                sx={{ fontWeight: "bold" }}
                              />
                            ) : (
                              <Chip
                                label="VERIFICADO OK"
                                color="success"
                                size="small"
                                sx={{ fontWeight: "bold" }}
                              />
                            )
                          ) : (
                            <Chip
                              label="PENDIENTE"
                              color="default"
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </TableCell>
                      )}
                      {verificationMode && (
                        <TableCell>
                          <Button
                            variant={isVerified ? "outlined" : "contained"}
                            size="small"
                            color={isVerified ? "success" : "primary"}
                            onClick={() => handleOpenVerifyDialog(item)}
                            startIcon={
                              isVerified ? <EditIcon /> : <VerifiedIcon />
                            }
                          >
                            {isVerified ? "Editar" : "Verificar"}
                          </Button>
                        </TableCell>
                      )}
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
          {currentItem && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                {getProductName(currentItem.product_id)}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Lote:</strong> {currentItem.batch_number || "N/A"}
              </Typography>
              <Typography variant="body2" gutterBottom sx={{ mb: 2 }}>
                <strong>Cantidad en Sistema:</strong>{" "}
                {currentItem.quantity_available}
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

              {actualQuantity !== currentItem.quantity_available && (
                <Alert
                  severity={
                    actualQuantity < currentItem.quantity_available
                      ? "warning"
                      : "info"
                  }
                  sx={{ mt: 2 }}
                >
                  Diferencia: {actualQuantity - currentItem.quantity_available}{" "}
                  unidades
                  {actualQuantity < currentItem.quantity_available
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
