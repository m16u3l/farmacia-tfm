"use client";
import { formatDate, isToday } from "@/utils/dateUtils";
import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Snackbar,
  Alert,
  Tooltip,
  Tabs,
  Tab,
  TextField,
  MenuItem,
  useMediaQuery,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LockIcon from "@mui/icons-material/LockOutlined";
import SavingsIcon from "@mui/icons-material/SavingsOutlined";
import PointOfSaleIcon from "@mui/icons-material/PointOfSaleOutlined";
import { Sell, SellFormData, PAYMENT_METHOD_LABELS, PaymentMethod } from "@/types";
import { SellForm } from "@/components/sells/SellForm";
import { CloseCashRegisterDialog } from "@/components/sells/CloseCashRegisterDialog";
import { useSells } from "@/hooks/useSells";
import { useCashRegisterClosures } from "@/hooks/useCashRegisterClosures";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { PageHeader } from "@/components/layout/PageHeader";
import { useConfirmDialog } from "@/components/common/ConfirmDialog";
import { fluidFontSize } from "@/utils/fluidType";

export default function SellsPage() {
  const [sells, setSells] = useState<Sell[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [openCloseCajaDialog, setOpenCloseCajaDialog] = useState(false);
  const [formData, setFormData] = useState<SellFormData>({
    payment_method: "efectivo",
    items: [],
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const { createSell, updateSell, deleteSell } = useSells();
  const { confirm, confirmDialog } = useConfirmDialog();
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));
  const { getPendingSummary, createClosure } = useCashRegisterClosures();
  const { user } = useCurrentUser();
  const isAdmin = user?.role === "admin";

  const fetchSells = async () => {
    try {
      const response = await fetch("/api/sells");
      const data = await response.json();
      setSells(data);
      setLoading(false);
    } catch {
      setError("Error al cargar las ventas");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSells();
  }, []);

  const handleEdit = (sell: Sell) => {
    setFormData({
      payment_method: sell.payment_method,
      items: sell.items || [],
    });
    setIsEditing(true);
    setOpenDialog(true);
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm({
      title: "Eliminar venta",
      message: "¿Está seguro de que desea eliminar esta venta? Esta acción no se puede deshacer.",
    });
    if (confirmed) {
      try {
        await deleteSell(id);
        setSnackbar({
          open: true,
          message: "Venta eliminada exitosamente",
          severity: "success",
        });
        await fetchSells();
      } catch (error) {
        setSnackbar({
          open: true,
          message: `Error al eliminar la venta: ${(error as Error).message}`,
          severity: "error",
        });
      }
    }
  };

  const handleFormChange = (
    field: keyof SellFormData,
    value: unknown
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (data: SellFormData) => {
    try {
      if (isEditing) {
        await updateSell(selectedSell!.sell_id, data);
        setSnackbar({
          open: true,
          message: "Venta actualizada exitosamente",
          severity: "success",
        });
      } else {
        await createSell(data);
        setSnackbar({
          open: true,
          message: "Venta creada exitosamente",
          severity: "success",
        });
      }
      setOpenDialog(false);
      await fetchSells();
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error: ${(error as Error).message}`,
        severity: "error",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      payment_method: "efectivo",
      items: [],
    });
    setIsEditing(false);
  };

  const [selectedSell, setSelectedSell] = useState<Sell | null>(null);
  const [tab, setTab] = useState<"today" | "history">("today");
  const [historyUser, setHistoryUser] = useState<string>("all");

  // "Hoy": lo que se muestra por defecto (para cajero/farmacéutico el API ya
  // devuelve solo sus propias ventas). "Historial": todas, con filtro por
  // usuario para el admin.
  const todaySells = sells.filter((s) => isToday(s.sell_date));
  const historyUserOptions = Array.from(
    new Set(sells.map((s) => s.user_name).filter(Boolean))
  ) as string[];
  const historySells =
    isAdmin && historyUser !== "all"
      ? sells.filter((s) => s.user_name === historyUser)
      : sells;
  const visibleSells = tab === "today" ? todaySells : historySells;
  const visibleTotal = visibleSells.reduce(
    (sum, s) => sum + (Number(s.total_amount) || 0),
    0
  );

  const columns: GridColDef[] = [
    { field: "sell_id", headerName: "ID", flex: 0.5, minWidth: 50, maxWidth: 70 },
    {
      field: "user_name",
      headerName: "Vendido por",
      flex: 1.2,
      minWidth: 120,
      renderCell: (params) => (
        <Typography sx={{ fontSize: fluidFontSize(0.75, 0.875) }}>
          {params.row.user_name || "—"}
        </Typography>
      ),
    },
    {
      field: "sell_date",
      headerName: "Fecha",
      flex: 1.2,
      minWidth: 100,
      renderCell: (params) => (
        <Typography sx={{ fontSize: fluidFontSize(0.75, 0.875) }}>
          {formatDate(params.row.sell_date)}
        </Typography>
      ),
    },
    {
      field: "total_amount",
      headerName: "Total",
      flex: 1,
      minWidth: 80,
      renderCell: (params) => (
        <Typography sx={{ fontSize: fluidFontSize(0.75, 0.875), fontWeight: 'bold' }}>
          ${params.row.total_amount}
        </Typography>
      ),
    },
    {
      field: "payment_method",
      headerName: "Método",
      flex: 1,
      minWidth: 80,
      renderCell: (params) => (
        <Typography sx={{ fontSize: fluidFontSize(0.75, 0.875) }}>
          {PAYMENT_METHOD_LABELS[params.row.payment_method as PaymentMethod]}
        </Typography>
      ),
    },
    {
      field: "actions",
      headerName: "Acciones",
      flex: 0.7,
      minWidth: 120,
      renderCell: (params: GridRenderCellParams) => {
        const locked = Boolean(params.row.closure_id) && !isAdmin;
        if (locked) {
          return (
            <Tooltip title="Venta incluida en un cierre de caja">
              <LockIcon fontSize="small" color="disabled" />
            </Tooltip>
          );
        }
        return (
          <Box sx={{ display: "flex", gap: 1 }}>
            <IconButton
              aria-label="Editar venta"
              color="primary"
              size="small"
              onClick={() => {
                setSelectedSell(params.row);
                handleEdit(params.row);
              }}
            >
              <EditIcon />
            </IconButton>
            <IconButton
              aria-label="Eliminar venta"
              color="error"
              size="small"
              onClick={() => handleDelete(params.row.sell_id)}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        );
      },
    },
  ];

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 4 }}>
        <PageHeader
          title="Ventas"
          subtitle="Registro de ventas realizadas al público"
          icon={<PointOfSaleIcon />}
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                resetForm();
                setOpenDialog(true);
              }}
              sx={{
                fontSize: fluidFontSize(0.75, 0.875),
                width: { xs: "100%", sm: "auto" },
              }}
            >
              Nueva venta
            </Button>
          }
        />

        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
        >
          <Tab value="today" label="Ventas de hoy" />
          <Tab value="history" label="Historial" />
        </Tabs>

        {tab === "history" && isAdmin && historyUserOptions.length > 0 && (
          <TextField
            select
            size="small"
            label="Usuario"
            value={historyUser}
            onChange={(e) => setHistoryUser(e.target.value)}
            sx={{ mb: 2, minWidth: 200 }}
          >
            <MenuItem value="all">Todos</MenuItem>
            {historyUserOptions.map((name) => (
              <MenuItem key={name} value={name}>
                {name}
              </MenuItem>
            ))}
          </TextField>
        )}

        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <DataGrid
            rows={visibleSells}
            columns={columns}
            getRowId={(row) => row.sell_id}
            loading={loading}
            autoHeight
            pageSizeOptions={[5, 10, 25]}
            disableRowSelectionOnClick
            columnVisibilityModel={
              isMobile ? { sell_id: false, user_name: false, payment_method: false } : {}
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
              "& .MuiDataGrid-cell": {
                padding: { xs: '4px', sm: '8px' },
              },
            }}
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            mt: 2,
            pt: 2,
            borderTop: 1,
            borderColor: "divider",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Typography variant="body1" color="text.secondary">
            {tab === "today" ? "Total de hoy" : "Total del historial mostrado"}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            ${visibleTotal.toFixed(2)}
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<SavingsIcon />}
          onClick={() => setOpenCloseCajaDialog(true)}
          sx={{
            mt: 2,
            fontSize: fluidFontSize(0.75, 0.875),
            width: { xs: "100%", sm: "auto" },
          }}
        >
          Cerrar caja
        </Button>

        {error && (
          <Typography color="error" mt={2}>
            {error}
          </Typography>
        )}
      </Paper>

      {confirmDialog}

      <SellForm
        open={openDialog}
        isEditing={isEditing}
        formData={formData}
        onClose={() => setOpenDialog(false)}
        onSubmit={handleSubmit}
        onChange={handleFormChange}
      />

      <CloseCashRegisterDialog
        open={openCloseCajaDialog}
        onClose={() => setOpenCloseCajaDialog(false)}
        getPendingSummary={getPendingSummary}
        onConfirm={async (data) => {
          await createClosure(data);
          setSnackbar({
            open: true,
            message: "Caja cerrada exitosamente",
            severity: "success",
          });
          await fetchSells();
        }}
      />

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
