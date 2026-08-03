"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  useMediaQuery,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridSortModel,
} from "@mui/x-data-grid";
import DownloadIcon from "@mui/icons-material/Download";
import { TopProductRow } from "@/types";
import { GridEmptyState } from "@/components/common/GridEmptyState";
import { getPeriodRange, PeriodPreset } from "@/utils/dateUtils";
import { fluidFontSize } from "@/utils/fluidType";
import { TopProductsChart, ChartBar } from "./TopProductsChart";

type RangeOption = PeriodPreset | "custom";

const PRESET_LABELS: { value: RangeOption; label: string }[] = [
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Este mes" },
  { value: "lastWeek", label: "Semana pasada" },
  { value: "lastMonth", label: "Mes pasado" },
  { value: "custom", label: "Personalizado" },
];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Columnas numéricas por las que el gráfico puede rankear (las demás, como
// Producto o Categoría, no son una métrica y caen en el default).
const METRIC_LABELS: Record<string, string> = {
  total_quantity: "unidades",
  total_revenue: "ingresos",
  total_cost: "costo",
  total_profit: "ganancia",
};

const money = (value: number | undefined) => `$${Number(value ?? 0).toFixed(2)}`;

// Los nombres de producto pueden traer comas o comillas y romperían el CSV.
const csvCell = (value: string | number) =>
  `"${String(value).replace(/"/g, '""')}"`;

export function TopProductsTab() {
  const [option, setOption] = useState<RangeOption>("month");
  const [range, setRange] = useState(() => getPeriodRange("month"));
  const [rows, setRows] = useState<TopProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: "total_quantity", sort: "desc" },
  ]);
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));

  useEffect(() => {
    // Mientras se tipea una fecha en el rango personalizado el input queda
    // incompleto; no tiene sentido pedirle al API un rango a medio escribir.
    if (!DATE_RE.test(range.from) || !DATE_RE.test(range.to)) return;

    const fetchTopProducts = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/sells/top-products?from=${range.from}&to=${range.to}`
        );
        const data = await response.json();
        if (!response.ok || !Array.isArray(data)) {
          console.error("Error al cargar productos más vendidos:", data);
          setRows([]);
          return;
        }
        setRows(data);
      } catch (error) {
        console.error("Error al cargar productos más vendidos:", error);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTopProducts();
  }, [range]);

  const handleOptionChange = (_: unknown, value: RangeOption | null) => {
    if (!value) return;
    setOption(value);
    if (value !== "custom") setRange(getPeriodRange(value));
  };

  // El API solo incluye costo/ganancia para admin.
  const hasProfit = rows.some((row) => row.total_profit !== undefined);

  const totals = useMemo(
    () => ({
      quantity: rows.reduce((sum, r) => sum + Number(r.total_quantity), 0),
      revenue: rows.reduce((sum, r) => sum + Number(r.total_revenue), 0),
      products: rows.length,
    }),
    [rows]
  );

  // El gráfico acompaña la métrica por la que se ordena la tabla, pero siempre
  // muestra el top 10 descendente: ordenar la tabla ascendente sirve para mirar
  // la cola, no para cambiar de qué habla el gráfico.
  const chart = useMemo(() => {
    const field = sortModel[0]?.field ?? "total_quantity";
    const metric = (
      METRIC_LABELS[field] ? field : "total_quantity"
    ) as keyof TopProductRow;
    const isMoney = metric !== "total_quantity";

    const bars: ChartBar[] = [...rows]
      .sort((a, b) => Number(b[metric] ?? 0) - Number(a[metric] ?? 0))
      .slice(0, 10)
      .map((row) => {
        const value = Number(row[metric] ?? 0);
        return {
          id: row.product_id,
          label: row.product_name,
          value,
          display: isMoney ? money(value) : String(value),
        };
      });

    return { bars, metricLabel: METRIC_LABELS[metric] };
  }, [rows, sortModel]);

  const columns: GridColDef[] = [
    {
      field: "product_name",
      headerName: "Producto",
      flex: 2.5,
      minWidth: 180,
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          variant="body2"
          sx={{ fontSize: fluidFontSize(0.75, 0.875), whiteSpace: "normal" }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: "category",
      headerName: "Categoría",
      flex: 1.2,
      minWidth: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: fluidFontSize(0.75, 0.875), whiteSpace: "normal" }}
        >
          {params.value || "—"}
        </Typography>
      ),
    },
    {
      field: "total_quantity",
      headerName: "Unidades",
      flex: 1,
      minWidth: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          variant="body2"
          sx={{ fontSize: fluidFontSize(0.75, 0.875), fontWeight: "bold" }}
        >
          {params.value}
          {params.row.unit ? ` ${params.row.unit}` : ""}
        </Typography>
      ),
    },
    {
      field: "total_revenue",
      headerName: "Ingresos",
      flex: 1,
      minWidth: 110,
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          variant="body2"
          sx={{
            fontSize: fluidFontSize(0.75, 0.875),
            fontWeight: "bold",
            color: "primary.main",
          }}
        >
          {money(params.value)}
        </Typography>
      ),
    },
    {
      field: "sell_count",
      headerName: "N.º de ventas",
      flex: 1,
      minWidth: 110,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontSize: fluidFontSize(0.75, 0.875) }}>
          {params.value}
        </Typography>
      ),
    },
    ...(hasProfit
      ? ([
          {
            field: "total_cost",
            headerName: "Costo",
            flex: 1,
            minWidth: 100,
            renderCell: (params: GridRenderCellParams) => (
              <Typography
                variant="body2"
                sx={{ fontSize: fluidFontSize(0.75, 0.875) }}
              >
                {money(params.value)}
              </Typography>
            ),
          },
          {
            field: "total_profit",
            headerName: "Ganancia",
            flex: 1,
            minWidth: 110,
            renderCell: (params: GridRenderCellParams) => (
              <Typography
                variant="body2"
                sx={{
                  fontSize: fluidFontSize(0.75, 0.875),
                  fontWeight: "bold",
                  color: Number(params.value) >= 0 ? "success.main" : "error.main",
                }}
              >
                {money(params.value)}
              </Typography>
            ),
          },
        ] as GridColDef[])
      : []),
  ];

  const handleExportCsv = () => {
    const csvContent = [
      [
        "Producto",
        "Categoría",
        "Unidades",
        "Ingresos",
        "N.º de ventas",
        ...(hasProfit ? ["Costo", "Ganancia"] : []),
      ],
      ...rows.map((row) => [
        row.product_name,
        row.category || "",
        row.total_quantity,
        money(row.total_revenue),
        row.sell_count,
        ...(hasProfit ? [money(row.total_cost), money(row.total_profit)] : []),
      ]),
    ]
      .map((row) => row.map(csvCell).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `productos-mas-vendidos-${range.from}_${range.to}.csv`;
    a.click();
  };

  return (
    <Box>
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
        <ToggleButtonGroup
          value={option}
          exclusive
          size="small"
          onChange={handleOptionChange}
          sx={{ flexWrap: "wrap" }}
        >
          {PRESET_LABELS.map((preset) => (
            <ToggleButton
              key={preset.value}
              value={preset.value}
              sx={{ fontSize: fluidFontSize(0.7, 0.8125) }}
            >
              {preset.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleExportCsv}
          disabled={rows.length === 0}
        >
          Exportar CSV
        </Button>
      </Box>

      {option === "custom" && (
        <Box sx={{ mb: 3, display: "flex", flexWrap: "wrap", gap: 2 }}>
          <TextField
            type="date"
            label="Desde"
            value={range.from}
            onChange={(e) => setRange((prev) => ({ ...prev, from: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            type="date"
            label="Hasta"
            value={range.to}
            onChange={(e) => setRange((prev) => ({ ...prev, to: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
        </Box>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Unidades Vendidas
              </Typography>
              <Typography variant="h4">{totals.quantity}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Ingresos
              </Typography>
              <Typography variant="h4" color="primary">
                {money(totals.revenue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Productos Distintos
              </Typography>
              <Typography variant="h4">{totals.products}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {chart.bars.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Top 10 por {chart.metricLabel}
          </Typography>
          <TopProductsChart bars={chart.bars} />
        </Box>
      )}

      <Typography variant="h6" sx={{ mb: 2 }}>
        Detalle por producto
      </Typography>
      <Box sx={{ width: "100%", overflowX: "auto" }}>
        <DataGrid
          slots={{
            noRowsOverlay: () => (
              <GridEmptyState message="No hay ventas en el período seleccionado" />
            ),
          }}
          rows={rows}
          columns={columns}
          getRowId={(row) => row.product_id}
          loading={loading}
          autoHeight
          getRowHeight={() => "auto"}
          pageSizeOptions={[5, 10, 25]}
          disableRowSelectionOnClick
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          columnVisibilityModel={
            isMobile ? { category: false, sell_count: false, total_cost: false } : {}
          }
          sx={{
            "& .MuiDataGrid-cell:focus": { outline: "none" },
            "& .MuiDataGrid-columnHeader": {
              backgroundColor: (theme) => theme.palette.primary.light,
              color: "white",
              fontSize: fluidFontSize(0.75, 0.875),
            },
            "& .MuiDataGrid-row:nth-of-type(even)": {
              backgroundColor: (theme) => theme.palette.action.hover,
            },
            "& .MuiDataGrid-overlay": { backgroundColor: "transparent" },
            "--DataGrid-overlayHeight": "220px",
            "& .MuiDataGrid-cell": {
              padding: { xs: "4px", sm: "8px" },
              display: "flex",
              alignItems: "center",
            },
          }}
        />
      </Box>
    </Box>
  );
}
