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
}

export default function ValidationsPage() {
  const [tabValue, setTabValue] = useState(0);
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [monthlySales, setMonthlySales] = useState<MonthlySales[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  useEffect(() => {
    fetchDailySales();
    fetchMonthlySales();
  }, []);

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

  const filteredDailySales = dailySales.filter(
    (sale) => sale.date === selectedDate
  );

  return (
    <Box sx={{ width: "100%", height: "100%", p: { xs: 1, sm: 3 } }}>
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
    </Box>
  );
}
