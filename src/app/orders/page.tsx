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
  Chip,
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { Order, OrderFormData, Supplier } from "@/types";
import { OrderForm } from "@/components/orders/OrderForm";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [formData, setFormData] = useState<OrderFormData>({
    supplier_id: 0,
    order_date: new Date().toISOString(),
    status: "pendiente",
    total_amount: 0,
    items: [],
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
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

  const fetchSuppliers = async () => {
    try {
      const response = await fetch("/api/suppliers");
      const data = await response.json();
      setSuppliers(data);
    } catch {
      console.error("Error al cargar proveedores");
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchSuppliers();
  }, []);

  const handleAdd = () => {
    setIsEditing(false);
    setSelectedOrder(null);
    setFormData({
      supplier_id: 0,
      order_date: new Date().toISOString(),
      status: "pendiente",
      total_amount: 0,
      items: [],
    });
    setOpenDialog(true);
  };

  const handleEdit = async (order: Order) => {
    try {
      // Obtener los detalles completos de la orden incluyendo items
      const response = await fetch(`/api/orders/${order.order_id}`);
      if (!response.ok) {
        throw new Error("Error al cargar los detalles de la orden");
      }
      
      const fullOrder = await response.json();
      
      // Transformar items para que coincidan con OrderFormData
      const formattedItems = (fullOrder.items || []).map((item: Record<string, unknown>) => ({
        product_id: Number(item.product_id),
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
      }));
      
      setIsEditing(true);
      setSelectedOrder(fullOrder);
      setFormData({
        supplier_id: fullOrder.supplier_id,
        order_date: fullOrder.order_date,
        status: fullOrder.status,
        total_amount: fullOrder.total_amount,
        items: formattedItems,
      });
      setOpenDialog(true);
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error al cargar la orden: ${(error as Error).message}`,
        severity: "error",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta orden?")) {
      try {
        const response = await fetch(`/api/orders/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setSnackbar({
            open: true,
            message: "Orden eliminada correctamente",
            severity: "success",
          });
          fetchOrders();
        } else {
          throw new Error("Error al eliminar");
        }
      } catch (error) {
        setSnackbar({
          open: true,
          message: `Error al eliminar la orden: ${(error as Error).message}`,
          severity: "error",
        });
      }
    }
  };

  const handleFormChange = (
    field: keyof OrderFormData,
    value: unknown
  ) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      
      // Recalcular total_amount cuando cambian los items
      if (field === "items") {
        const items = value as OrderFormData["items"];
        updated.total_amount = items.reduce(
          (sum, item) => sum + (item.quantity * item.unit_price),
          0
        );
      }
      
      return updated;
    });
  };

  const handleSubmit = async (data: OrderFormData) => {
    try {
      if (!data.supplier_id || data.supplier_id === 0) {
        setSnackbar({
          open: true,
          message: "Por favor selecciona un proveedor",
          severity: "error",
        });
        return;
      }

      if (!data.items || data.items.length === 0) {
        setSnackbar({
          open: true,
          message: "Por favor agrega al menos un producto",
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
            ? "Orden actualizada correctamente"
            : "Orden creada correctamente",
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

  const getSupplierName = (supplierId: number) => {
    const supplier = suppliers.find((s) => s.supplier_id === supplierId);
    return supplier ? supplier.name : `Proveedor ${supplierId}`;
  };

  const getStatusColor = (status: string):
    | "default"
    | "primary"
    | "secondary"
    | "error"
    | "info"
    | "success"
    | "warning" => {
    switch (status) {
      case "pendiente":
        return "warning";
      case "aprobado":
        return "info";
      case "recibido":
        return "success";
      case "cancelado":
        return "error";
      default:
        return "default";
    }
  };

  const columns: GridColDef[] = [
    { 
      field: "order_id", 
      headerName: "ID", 
      flex: 0.5, 
      minWidth: 50, 
      maxWidth: 70 
    },
    {
      field: "supplier_name",
      headerName: "Proveedor",
      flex: 2,
      minWidth: 150,
  valueGetter: (params: { row: Record<string, unknown> }) => getSupplierName(Number(params.row?.supplier_id)),
    },
    {
      field: "order_date",
      headerName: "Fecha",
      flex: 1.5,
      minWidth: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
          {new Date(params.value).toLocaleDateString()}
        </Typography>
      ),
    },
    {
      field: "status",
      headerName: "Estado",
      flex: 1.2,
      minWidth: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={String(params.value ?? "").toUpperCase()}
          color={getStatusColor(String(params.value ?? ""))}
          size="small"
          sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' }, fontWeight: 'bold' }}
        />
      ),
    },
    {
      field: "total_amount",
      headerName: "Total",
      flex: 1,
      minWidth: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Typography 
          variant="body2" 
          sx={{ 
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            fontWeight: 'bold',
            color: 'primary.main'
          }}
        >
          ${params.value || "0.00"}
        </Typography>
      ),
    },
    {
      field: "actions",
      headerName: "Acciones",
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <IconButton
            size="small"
            onClick={() => handleEdit(params.row)}
            color="primary"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDelete(params.row.order_id)}
            color="error"
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
            Órdenes de Compra
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              width: { xs: '100%', sm: 'auto' },
              maxWidth: { xs: "100%", sm: "auto" }
            }}
          >
            Nueva Orden
          </Button>
        </Box>

        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <DataGrid
            rows={orders}
            columns={columns}
            getRowId={(row) => row.order_id}
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

      <OrderForm
        open={openDialog}
        isEditing={isEditing}
        formData={formData}
        suppliers={suppliers}
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
