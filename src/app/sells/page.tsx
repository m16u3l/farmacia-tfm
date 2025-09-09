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
    customer_name: null,
    employee_id: null,
    payment_method: "efectivo",
    items: [],
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
      customer_name: sell.customer_name ?? null,
      employee_id: sell.employee_id ?? null,
      payment_method: sell.payment_method,
      items: sell.items || [],
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
      customer_name: null,
      employee_id: null,
      payment_method: "efectivo",
      items: [],
    });
    setIsEditing(false);
  };

  const [selectedSell, setSelectedSell] = useState<Sell | null>(null);

  const columns: GridColDef[] = [
    { field: "sell_id", headerName: "ID", flex: 0.5, minWidth: 50, maxWidth: 70 },
    { field: "customer_name", headerName: "Cliente", flex: 1.5, minWidth: 120 },
    { 
      field: "employee_name", 
      headerName: "Empleado", 
      flex: 1.5, 
      minWidth: 120,
      renderCell: (params) => (
        <Typography sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
          {params.row.employee_name || `ID: ${params.row.employee_id}`}
        </Typography>
      ),
    },
    {
      field: "sell_date",
      headerName: "Fecha",
      flex: 1.2,
      minWidth: 100,
      renderCell: (params) => (
        <Typography sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
          {new Date(params.row.sell_date).toLocaleDateString()}
        </Typography>
      ),
    },
    {
      field: "total_amount",
      headerName: "Total",
      flex: 1,
      minWidth: 80,
      renderCell: (params) => (
        <Typography sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 'bold' }}>
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
        <Typography sx={{ 
          textTransform: "capitalize",
          fontSize: { xs: '0.75rem', sm: '0.875rem' }
        }}>
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
    <Box sx={{ width: "100%", height: "100%", p: { xs: 1, sm: 3 } }}>
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 4 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
          flexDirection={{ xs: "column", sm: "row" }}
          gap={{ xs: 2, sm: 0 }}
        >
          <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            Ventas
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              resetForm();
              setOpenDialog(true);
            }}
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            Nueva venta
          </Button>
        </Box>
        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <DataGrid
            rows={sells}
            columns={columns}
            getRowId={(row) => row.sell_id}
            loading={loading}
            autoHeight
            pageSizeOptions={[5, 10, 25]}
            disableRowSelectionOnClick
            sx={{
              minWidth: 600,
              "& .MuiDataGrid-cell:focus": { outline: "none" },
              "& .MuiDataGrid-columnHeader": {
                backgroundColor: (theme) => theme.palette.primary.light,
                color: "white",
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
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
