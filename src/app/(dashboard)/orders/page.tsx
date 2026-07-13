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
  Tooltip,
  useMediaQuery,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircleOutline";
import BlockIcon from "@mui/icons-material/Block";
import LocalMallIcon from "@mui/icons-material/LocalMallOutlined";
import { Order, OrderFormData, OrderStatus, ExpenseFormData } from "@/types";
import { OrderForm } from "@/components/orders/OrderForm";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { useConfirmDialog } from "@/components/common/ConfirmDialog";
import { GridEmptyState } from "@/components/common/GridEmptyState";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { fluidFontSize } from "@/utils/fluidType";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [formData, setFormData] = useState<OrderFormData>({
    product_ids: [],
    note: "",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const { confirm, confirmDialog } = useConfirmDialog();
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));
  const { user } = useCurrentUser();
  const isAdmin = user?.role === "admin";
  // Gasto opcional ofrecido al admin al marcar una solicitud como comprada
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [expenseFormData, setExpenseFormData] = useState<ExpenseFormData>({
    category: "orden_compra",
    amount: "",
    expense_date: new Date().toISOString().slice(0, 10),
    description: "",
    order_id: null,
  });

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders");
      const data = await response.json();
      setOrders(data);
      setLoading(false);
    } catch {
      setError("Error al cargar las órdenes");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleAdd = () => {
    setIsEditing(false);
    setSelectedOrder(null);
    setFormData({ product_ids: [], note: "" });
    setOpenDialog(true);
  };

  const handleEdit = (order: Order) => {
    setIsEditing(true);
    setSelectedOrder(order);
    setFormData({
      product_ids: order.products.map((p) => p.product_id),
      note: order.note || "",
    });
    setOpenDialog(true);
  };

  const handleStatusChange = async (order: Order, status: OrderStatus) => {
    const confirmed = await confirm({
      title: status === "comprado" ? "Marcar como comprado" : "Descartar solicitud",
      message:
        status === "comprado"
          ? "¿Marcar esta solicitud como comprada?"
          : "¿Descartar esta solicitud? Quedará en el historial como descartada.",
      confirmLabel: status === "comprado" ? "Comprado" : "Descartar",
    });
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/orders/${order.order_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Error al actualizar");
      setSnackbar({
        open: true,
        message:
          status === "comprado"
            ? "Solicitud marcada como comprada"
            : "Solicitud descartada",
        severity: "success",
      });
      fetchOrders();
      // Al comprar, el admin puede registrar de una vez el gasto real de la compra
      if (status === "comprado" && isAdmin) {
        setExpenseFormData({
          category: "orden_compra",
          amount: "",
          expense_date: new Date().toISOString().slice(0, 10),
          description: `Compra: ${order.products.map((p) => p.name).join(", ")}`,
          order_id: order.order_id,
        });
        setExpenseFormOpen(true);
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error al actualizar la solicitud: ${(error as Error).message}`,
        severity: "error",
      });
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm({
      title: "Eliminar solicitud",
      message: "¿Eliminar esta solicitud de compra? Esta acción no se puede deshacer.",
    });
    if (confirmed) {
      try {
        const response = await fetch(`/api/orders/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setSnackbar({
            open: true,
            message: "Solicitud eliminada correctamente",
            severity: "success",
          });
          fetchOrders();
        } else {
          throw new Error("Error al eliminar");
        }
      } catch (error) {
        setSnackbar({
          open: true,
          message: `Error al eliminar la solicitud: ${(error as Error).message}`,
          severity: "error",
        });
      }
    }
  };

  const handleFormChange = (field: keyof OrderFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (data: OrderFormData) => {
    try {
      if (data.product_ids.length === 0) {
        setSnackbar({
          open: true,
          message: "Selecciona al menos un producto faltante",
          severity: "error",
        });
        return;
      }

      const url = isEditing && selectedOrder
        ? `/api/orders/${selectedOrder.order_id}`
        : "/api/orders";

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: isEditing
            ? "Solicitud actualizada correctamente"
            : "Solicitud registrada correctamente",
          severity: "success",
        });
        setOpenDialog(false);
        fetchOrders();
      } else {
        throw new Error("Error en la operación");
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error: ${(error as Error).message}`,
        severity: "error",
      });
    }
  };

  const getStatusColor = (status: string): "warning" | "success" | "default" => {
    switch (status) {
      case "pendiente":
        return "warning";
      case "comprado":
        return "success";
      default:
        return "default";
    }
  };

  const columns: GridColDef[] = [
    {
      field: "order_date",
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
      field: "products",
      headerName: "Productos faltantes",
      flex: 2.5,
      minWidth: 200,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, py: 0.5 }}>
          {(params.row.products as Order["products"]).map((p) => (
            <Chip
              key={p.product_id}
              label={p.name}
              size="small"
              sx={{ fontSize: fluidFontSize(0.65, 0.75) }}
            />
          ))}
        </Box>
      ),
    },
    {
      field: "note",
      headerName: "Nota",
      flex: 2,
      minWidth: 150,
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
      field: "status",
      headerName: "Estado",
      flex: 1,
      minWidth: 110,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={String(params.value ?? "").toUpperCase()}
          color={getStatusColor(String(params.value ?? ""))}
          size="small"
          sx={{ fontSize: fluidFontSize(0.6, 0.75), fontWeight: 'bold' }}
        />
      ),
    },
    {
      field: "actions",
      headerName: "Acciones",
      width: 160,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        const order = params.row as Order;
        const isPending = order.status === "pendiente";
        return (
          <Box>
            {isPending && (
              <>
                <Tooltip title="Marcar como comprado">
                  <IconButton
                    aria-label="Marcar como comprado"
                    size="small"
                    onClick={() => handleStatusChange(order, "comprado")}
                    color="success"
                  >
                    <CheckCircleIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Descartar">
                  <IconButton
                    aria-label="Descartar solicitud"
                    size="small"
                    onClick={() => handleStatusChange(order, "descartado")}
                  >
                    <BlockIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Editar">
                  <IconButton
                    aria-label="Editar solicitud"
                    size="small"
                    onClick={() => handleEdit(order)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}
            <Tooltip title="Eliminar">
              <IconButton
                aria-label="Eliminar solicitud"
                size="small"
                onClick={() => handleDelete(order.order_id)}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 4 }}>
        <PageHeader
          title="Órdenes de Compra"
          subtitle="Productos faltantes que se necesita comprar"
          icon={<LocalMallIcon />}
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAdd}
              sx={{
                fontSize: fluidFontSize(0.75, 0.875),
                width: { xs: "100%", sm: "auto" },
                maxWidth: { xs: "100%", sm: "auto" },
              }}
            >
              Reportar faltante
            </Button>
          }
        />

        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <DataGrid
            slots={{
              noRowsOverlay: () => (
                <GridEmptyState
                  message="No hay solicitudes de reposición todavía"
                  actionLabel="Nueva solicitud"
                  onAction={handleAdd}
                />
              ),
            }}
            rows={orders}
            columns={columns}
            getRowId={(row) => row.order_id}
            loading={loading}
            autoHeight
            getRowHeight={() => "auto"}
            pageSizeOptions={[5, 10, 25]}
            disableRowSelectionOnClick
            columnVisibilityModel={isMobile ? { note: false } : {}}
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
                padding: { xs: '4px', sm: '8px' },
                display: "flex",
                alignItems: "center",
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

      {confirmDialog}

      <OrderForm
        open={openDialog}
        isEditing={isEditing}
        formData={formData}
        onClose={() => setOpenDialog(false)}
        onSubmit={handleSubmit}
        onChange={handleFormChange}
      />

      <ExpenseForm
        open={expenseFormOpen}
        isEditing={false}
        formData={expenseFormData}
        onClose={() => setExpenseFormOpen(false)}
        onSubmit={async (data) => {
          try {
            const response = await fetch("/api/expenses", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });
            if (!response.ok) {
              const body = await response.json().catch(() => null);
              throw new Error(body?.error || "Error al registrar el gasto");
            }
            setExpenseFormOpen(false);
            setSnackbar({
              open: true,
              message: "Gasto de la compra registrado",
              severity: "success",
            });
          } catch (error) {
            setSnackbar({
              open: true,
              message: `Error: ${(error as Error).message}`,
              severity: "error",
            });
          }
        }}
        onChange={(field, value) =>
          setExpenseFormData((prev) => ({ ...prev, [field]: value }))
        }
      />

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
