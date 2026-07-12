"use client";
import { formatDate } from "@/utils/dateUtils";
import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Snackbar,
  Alert,
  Chip,
  useMediaQuery,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PaymentsIcon from "@mui/icons-material/PaymentsOutlined";
import { Expense, ExpenseFormData, EXPENSE_CATEGORY_LABELS } from "@/types";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { useConfirmDialog } from "@/components/common/ConfirmDialog";
import { fluidFontSize } from "@/utils/fluidType";

const emptyForm = (): ExpenseFormData => ({
  category: "administrativo",
  amount: "",
  expense_date: new Date().toISOString().slice(0, 10),
  description: "",
  order_id: null,
});

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState<ExpenseFormData>(emptyForm());
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const { confirm, confirmDialog } = useConfirmDialog();
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));

  const fetchExpenses = async () => {
    try {
      const response = await fetch("/api/expenses");
      const data = await response.json();
      setExpenses(data);
      setLoading(false);
    } catch {
      setError("Error al cargar los gastos");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAdd = () => {
    setIsEditing(false);
    setSelectedExpense(null);
    setFormData(emptyForm());
    setOpenDialog(true);
  };

  const handleEdit = (expense: Expense) => {
    setIsEditing(true);
    setSelectedExpense(expense);
    setFormData({
      category: expense.category,
      amount: String(expense.amount),
      expense_date: String(expense.expense_date).slice(0, 10),
      description: expense.description || "",
      order_id: expense.order_id,
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm({
      title: "Eliminar gasto",
      message: "¿Eliminar este gasto? Esta acción no se puede deshacer.",
    });
    if (confirmed) {
      try {
        const response = await fetch(`/api/expenses/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          setSnackbar({
            open: true,
            message: "Gasto eliminado correctamente",
            severity: "success",
          });
          fetchExpenses();
        } else {
          throw new Error("Error al eliminar");
        }
      } catch (error) {
        setSnackbar({
          open: true,
          message: `Error al eliminar el gasto: ${(error as Error).message}`,
          severity: "error",
        });
      }
    }
  };

  const handleFormChange = (field: keyof ExpenseFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (data: ExpenseFormData) => {
    try {
      const url = isEditing && selectedExpense
        ? `/api/expenses/${selectedExpense.expense_id}`
        : "/api/expenses";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: isEditing
            ? "Gasto actualizado correctamente"
            : "Gasto registrado correctamente",
          severity: "success",
        });
        setOpenDialog(false);
        fetchExpenses();
      } else {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || "Error en la operación");
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error: ${(error as Error).message}`,
        severity: "error",
      });
    }
  };

  const columns: GridColDef[] = [
    {
      field: "expense_date",
      headerName: "Fecha",
      flex: 1,
      minWidth: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontSize: fluidFontSize(0.75, 0.875) }}>
          {formatDate(params.value)}
        </Typography>
      ),
    },
    {
      field: "category",
      headerName: "Categoría",
      flex: 1.2,
      minWidth: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={EXPENSE_CATEGORY_LABELS[params.value as Expense["category"]] || params.value}
          color={params.value === "orden_compra" ? "info" : "default"}
          size="small"
          sx={{ fontSize: fluidFontSize(0.6, 0.75) }}
        />
      ),
    },
    {
      field: "description",
      headerName: "Descripción",
      flex: 2.5,
      minWidth: 180,
      renderCell: (params: GridRenderCellParams) => {
        const expense = params.row as Expense;
        return (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: fluidFontSize(0.75, 0.875), whiteSpace: "normal" }}
          >
            {expense.description ||
              (expense.order_products ? `Compra: ${expense.order_products}` : "—")}
          </Typography>
        );
      },
    },
    {
      field: "amount",
      headerName: "Monto",
      flex: 1,
      minWidth: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          variant="body2"
          sx={{
            fontSize: fluidFontSize(0.75, 0.875),
            fontWeight: "bold",
            color: "primary.main",
          }}
        >
          ${Number(params.value).toFixed(2)}
        </Typography>
      ),
    },
    {
      field: "actions",
      headerName: "Acciones",
      width: 110,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <IconButton
            aria-label="Editar gasto"
            size="small"
            onClick={() => handleEdit(params.row)}
            color="primary"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            aria-label="Eliminar gasto"
            size="small"
            onClick={() => handleDelete(params.row.expense_id)}
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  const totalShown = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 4 }}>
        <PageHeader
          title="Gastos"
          subtitle="Gastos administrativos y de compras"
          icon={<PaymentsIcon />}
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAdd}
              sx={{
                fontSize: fluidFontSize(0.75, 0.875),
                width: { xs: "100%", sm: "auto" },
              }}
            >
              Registrar gasto
            </Button>
          }
        />

        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <DataGrid
            rows={expenses}
            columns={columns}
            getRowId={(row) => row.expense_id}
            loading={loading}
            autoHeight
            getRowHeight={() => "auto"}
            pageSizeOptions={[5, 10, 25]}
            disableRowSelectionOnClick
            columnVisibilityModel={isMobile ? { description: false } : {}}
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
                display: "flex",
                alignItems: "center",
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
          }}
        >
          <Typography variant="body1" color="text.secondary">
            Total de gastos
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            ${totalShown.toFixed(2)}
          </Typography>
        </Box>

        {error && (
          <Typography color="error" mt={2}>
            {error}
          </Typography>
        )}
      </Paper>

      {confirmDialog}

      <ExpenseForm
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
