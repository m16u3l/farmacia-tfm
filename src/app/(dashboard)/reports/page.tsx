"use client";
import { formatDate } from "@/utils/dateUtils";
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
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Alert,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import AssessmentIcon from "@mui/icons-material/AssessmentOutlined";
import { PageHeader } from "@/components/layout/PageHeader";

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
      id={`report-tabpanel-${index}`}
      aria-labelledby={`report-tab-${index}`}
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
  // Solo presentes para admin: ganancia neta = ventas − costo − gastos
  total_cost?: number;
  total_expenses?: number;
  net_profit?: number;
}

const formatMonthLabel = (monthKey: string) => {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });
};

export default function ReportsPage() {
  const [tabValue, setTabValue] = useState(0);
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [selectedDaySales, setSelectedDaySales] = useState<DailySales | null>(null);
  const [monthlySales, setMonthlySales] = useState<MonthlySales[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const fetchDailySalesHistory = async () => {
    try {
      const response = await fetch("/api/sells/report?granularity=daily");
      const data = await response.json();
      if (!response.ok || !Array.isArray(data)) {
        console.error("Error al cargar ventas diarias:", data);
        setDailySales([]);
        return;
      }
      setDailySales(data);
    } catch (error) {
      console.error("Error al cargar ventas diarias:", error);
    }
  };

  const fetchSelectedDaySales = async (date: string) => {
    try {
      const response = await fetch(`/api/sells/report?granularity=daily&date=${date}`);
      const data = await response.json();
      if (!response.ok || !Array.isArray(data)) {
        console.error("Error al cargar ventas del día:", data);
        setSelectedDaySales(null);
        return;
      }
      setSelectedDaySales(data[0] ?? null);
    } catch (error) {
      console.error("Error al cargar ventas del día:", error);
    }
  };

  const fetchMonthlySales = async () => {
    try {
      const response = await fetch("/api/sells/report?granularity=monthly");
      const data = await response.json();
      if (!response.ok || !Array.isArray(data)) {
        console.error("Error al cargar ventas mensuales:", data);
        setMonthlySales([]);
        return;
      }
      // month se guarda crudo ("YYYY-MM") para poder filtrar por el selector
      // de mes; se formatea recién al mostrar/exportar.
      setMonthlySales(data);
    } catch (error) {
      console.error("Error al cargar ventas mensuales:", error);
    }
  };

  useEffect(() => {
    fetchDailySalesHistory();
    fetchMonthlySales();
  }, []);

  useEffect(() => {
    fetchSelectedDaySales(selectedDate);
  }, [selectedDate]);

  const handleExportDailySales = () => {
    const csvContent = [
      ["Fecha", "Total Ventas", "Monto Total", "Productos Vendidos"],
      ...dailySales.map((sale) => [
        formatDate(sale.date),
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

  // El API solo incluye costo/gastos/ganancia para admin
  const hasProfit = monthlySales.some((sale) => sale.net_profit !== undefined);

  // El selector de mes filtra la tabla y el export; vacío = todos los meses.
  const visibleMonthlySales = selectedMonth
    ? monthlySales.filter((sale) => sale.month === selectedMonth)
    : monthlySales;

  const handleExportMonthlySales = () => {
    const csvContent = [
      [
        "Mes",
        "Total Ventas",
        "Monto Total",
        "Productos Vendidos",
        ...(hasProfit ? ["Costo Productos", "Gastos", "Ganancia Neta"] : []),
      ],
      ...visibleMonthlySales.map((sale) => [
        formatMonthLabel(sale.month),
        sale.total_sales,
        `$${sale.total_amount}`,
        sale.products_sold,
        ...(hasProfit
          ? [`$${sale.total_cost}`, `$${sale.total_expenses}`, `$${sale.net_profit}`]
          : []),
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

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <PageHeader
          title="Reportes"
          subtitle="Desempeño de ventas diario y mensual"
          icon={<AssessmentIcon />}
        />

        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Reporte Diario de Ventas" />
            <Tab label="Reporte Mensual de Ventas" />
          </Tabs>
        </Box>

        {/* TAB 1: Reporte Diario de Ventas */}
        <TabPanel value={tabValue} index={0}>
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

          {selectedDaySales ? (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Ventas
                    </Typography>
                    <Typography variant="h4">
                      {selectedDaySales.total_sales}
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
                      ${selectedDaySales.total_amount}
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
                      {selectedDaySales.products_sold}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Alert severity="info" sx={{ mb: 3 }}>
              No hay ventas registradas para esta fecha.
            </Alert>
          )}

          <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
            Historial de Ventas Diarias
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: "primary.light", color: "white", fontWeight: "bold" }}>
                    Fecha
                  </TableCell>
                  <TableCell sx={{ bgcolor: "primary.light", color: "white", fontWeight: "bold" }}>
                    Total Ventas
                  </TableCell>
                  <TableCell sx={{ bgcolor: "primary.light", color: "white", fontWeight: "bold" }}>
                    Monto Total
                  </TableCell>
                  <TableCell sx={{ bgcolor: "primary.light", color: "white", fontWeight: "bold" }}>
                    Productos Vendidos
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dailySales.map((sale, index) => (
                  <TableRow
                    key={index}
                    sx={{ "&:nth-of-type(even)": { bgcolor: "action.hover" } }}
                  >
                    <TableCell>
                      {formatDate(sale.date)}
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

        {/* TAB 2: Reporte Mensual de Ventas */}
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
                <TableRow>
                  <TableCell sx={{ bgcolor: "primary.light", color: "white", fontWeight: "bold" }}>
                    Mes
                  </TableCell>
                  <TableCell sx={{ bgcolor: "primary.light", color: "white", fontWeight: "bold" }}>
                    Total Ventas
                  </TableCell>
                  <TableCell sx={{ bgcolor: "primary.light", color: "white", fontWeight: "bold" }}>
                    Monto Total
                  </TableCell>
                  <TableCell sx={{ bgcolor: "primary.light", color: "white", fontWeight: "bold" }}>
                    Productos Vendidos
                  </TableCell>
                  {hasProfit && (
                    <>
                      <TableCell sx={{ bgcolor: "primary.light", color: "white", fontWeight: "bold" }}>
                        Costo Productos
                      </TableCell>
                      <TableCell sx={{ bgcolor: "primary.light", color: "white", fontWeight: "bold" }}>
                        Gastos
                      </TableCell>
                      <TableCell sx={{ bgcolor: "primary.light", color: "white", fontWeight: "bold" }}>
                        Ganancia Neta
                      </TableCell>
                    </>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleMonthlySales.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={hasProfit ? 7 : 4}>
                      <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
                        Sin datos para el mes seleccionado
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {visibleMonthlySales.map((sale, index) => (
                  <TableRow
                    key={index}
                    sx={{ "&:nth-of-type(even)": { bgcolor: "action.hover" } }}
                  >
                    <TableCell sx={{ textTransform: "capitalize" }}>
                      {formatMonthLabel(sale.month)}
                    </TableCell>
                    <TableCell>{sale.total_sales}</TableCell>
                    <TableCell>
                      <Typography color="primary" fontWeight="bold">
                        ${sale.total_amount}
                      </Typography>
                    </TableCell>
                    <TableCell>{sale.products_sold}</TableCell>
                    {hasProfit && (
                      <>
                        <TableCell>${sale.total_cost}</TableCell>
                        <TableCell>${sale.total_expenses}</TableCell>
                        <TableCell>
                          <Typography
                            fontWeight="bold"
                            color={Number(sale.net_profit) >= 0 ? "success.main" : "error.main"}
                          >
                            ${sale.net_profit}
                          </Typography>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>
    </Box>
  );
}
