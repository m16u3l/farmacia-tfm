"use client";
import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { Sell, SellFormData } from "@/types";
import { SellForm } from "@/components/sells/SellForm";
import { useSells } from "@/hooks/useSells";

export default function SellsPage() {
  const [sells, setSells] = useState<Sell[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<SellFormData>({
    customer_id: null,
    employee_id: null,
    payment_method: "efectivo",
    total_amount: 0,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const { createSell, updateSell, deleteSell } = useSells();

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
      customer_id: sell.customer_id ?? null,
      employee_id: sell.employee_id ?? null,
      payment_method: sell.payment_method,
      total_amount: sell.total_amount,
    });
    setIsEditing(true);
    setOpenDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Está seguro de que desea eliminar esta venta?")) {
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
    value: string | number | null
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
      customer_id: null,
      employee_id: null,
      payment_method: "efectivo",
      total_amount: 0,
    });
    setIsEditing(false);
  };

  const [selectedSell, setSelectedSell] = useState<Sell | null>(null);

  const columns: GridColDef[] = [
    { field: "sell_id", headerName: "ID", flex: 0.5, minWidth: 80 },
    { field: "customer_id", headerName: "Cliente ID", flex: 0.8, minWidth: 100 },
    { field: "employee_id", headerName: "Empleado ID", flex: 0.8, minWidth: 100 },
    {
      field: "sell_date",
      headerName: "Fecha",
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <Typography>
          {new Date(params.row.sell_date).toLocaleDateString()}
        </Typography>
      ),
    },
    {
      field: "total_amount",
      headerName: "Total",
      flex: 0.8,
      minWidth: 100,
      renderCell: (params) => (
        <Typography>
          ${params.row.total_amount?.toFixed(2) || "0.00"}
        </Typography>
      ),
    },
    {
      field: "payment_method",
      headerName: "Método de Pago",
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <Typography sx={{ textTransform: "capitalize" }}>
          {params.row.payment_method}
        </Typography>
      ),
    },
    {
      field: "actions",
      headerName: "Acciones",
      flex: 0.7,
      minWidth: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton
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
            color="error"
            size="small"
            onClick={() => handleDelete(params.row.sell_id)}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography variant="h4">Ventas</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              resetForm();
              setOpenDialog(true);
            }}
          >
            Nueva venta
          </Button>
        </Box>
        <Box sx={{ width: "100%" }}>
          <DataGrid
            rows={sells}
            columns={columns}
            getRowId={(row) => row.sell_id}
            loading={loading}
            autoHeight
            pageSizeOptions={[5, 10, 25]}
            disableRowSelectionOnClick
            sx={{
              "& .MuiDataGrid-cell:focus": { outline: "none" },
              "& .MuiDataGrid-columnHeader": {
                backgroundColor: (theme) => theme.palette.primary.light,
                color: "white",
              },
              "& .MuiDataGrid-row:nth-of-type(even)": {
                backgroundColor: (theme) => theme.palette.action.hover,
              },
              "& .MuiDataGrid-overlay": { backgroundColor: "transparent" },
            }}
          />
        </Box>
        {error && (
          <Typography color="error" mt={2}>
            {error}
          </Typography>
        )}
      </Paper>

      <SellForm
        open={openDialog}
        isEditing={isEditing}
        formData={formData}
        onClose={() => setOpenDialog(false)}
        onSubmit={handleSubmit}
        onChange={handleFormChange}
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
