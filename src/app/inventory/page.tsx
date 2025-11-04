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
import WarningIcon from "@mui/icons-material/Warning";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import { Inventory, InventoryFormData, Product } from "@/types";
import { InventoryForm } from "@/components/inventory/InventoryForm";
import { useInventory } from "@/hooks/useInventory";

export default function InventoryPage() {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);
  const [formData, setFormData] = useState<InventoryFormData>({
    product_id: 0,
    batch_number: null,
    expiry_date: null,
    quantity_available: 0,
    location: null,
    purchase_price: 0,
    sale_price: 0,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const { createInventoryItem, updateInventoryItem, deleteInventoryItem } = useInventory();

  const fetchInventory = async () => {
    try {
      const response = await fetch("/api/inventory");
      const data = await response.json();
      setInventory(data);
      setLoading(false);
    } catch {
      setError("Error al cargar el inventario");
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();
      setProducts(data);
    } catch {
      console.error("Error al cargar productos");
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchProducts();
  }, []);

  const handleAdd = () => {
    setIsEditing(false);
    setSelectedItem(null);
    setFormData({
      product_id: 0,
      batch_number: null,
      expiry_date: null,
      quantity_available: 0,
      location: null,
      purchase_price: 0,
      sale_price: 0,
    });
    setOpenDialog(true);
  };

  const handleEdit = (item: Inventory) => {
    setIsEditing(true);
    setSelectedItem(item);
    setFormData({
      product_id: item.product_id,
      batch_number: item.batch_number,
      expiry_date: item.expiry_date,
      quantity_available: item.quantity_available,
      location: item.location,
      purchase_price: item.purchase_price,
      sale_price: item.sale_price,
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este elemento?")) {
      try {
        const success = await deleteInventoryItem(id);
        if (success) {
          setSnackbar({
            open: true,
            message: "Elemento eliminado correctamente",
            severity: "success",
          });
          fetchInventory();
        }
      } catch (error) {
        setSnackbar({
          open: true,
          message: `Error al eliminar el elemento: ${(error as Error).message}`,
          severity: "error",
        });
      }
    }
  };

  const handleFormChange = (
    field: keyof InventoryFormData,
    value: string | number | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (data: InventoryFormData) => {
    try {
      // Validar que product_id no sea 0 o null
      if (!data.product_id || data.product_id === 0) {
        setSnackbar({
          open: true,
          message: "Por favor selecciona un producto",
          severity: "error",
        });
        return;
      }

      if (isEditing && selectedItem) {
        const result = await updateInventoryItem(selectedItem.inventory_id, data);
        if (result) {
          setSnackbar({
            open: true,
            message: "Elemento actualizado correctamente",
            severity: "success",
          });
        }
      } else {
        const result = await createInventoryItem(data);
        if (result) {
          setSnackbar({
            open: true,
            message: "Elemento creado correctamente",
            severity: "success",
          });
        }
      }
      setOpenDialog(false);
      fetchInventory();
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error: ${(error as Error).message}`,
        severity: "error",
      });
    }
  };

  const getProductName = (productId: number) => {
    const product = products.find(p => p.product_id == productId);
    return product ? product.name : `${productId}`;
  };

  const isLowStock = (quantity: number) => {
    return quantity <= 10; // Consider low stock if 10 or fewer items
  };

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return expiry < today;
  };

  const isAboutToExpire = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 40 && daysUntilExpiry >= 0; // About to expire within 40 days
  };

  const getLowStockItems = () => {
    return inventory.filter(item => isLowStock(item.quantity_available));
  };

  const getExpiringItems = () => {
    return inventory.filter(item => item.expiry_date && isAboutToExpire(item.expiry_date));
  };

  const getExpiredItems = () => {
    return inventory.filter(item => item.expiry_date && isExpired(item.expiry_date));
  };

  const columns: GridColDef[] = [
    { field: "inventory_id", headerName: "ID", flex: 0.5, minWidth: 50, maxWidth: 70 },
    {
      field: "product_name",
      headerName: "Producto",
      flex: 2,
      minWidth: 150,
      valueGetter: (params) => getProductName(params),
    },
    { 
      field: "batch_number", 
      headerName: "Lote", 
      flex: 1, 
      minWidth: 80,
    },
    {
      field: "expiry_date",
      headerName: "Vencimiento",
      flex: 1.5,
      minWidth: 120,
      renderCell: (params: GridRenderCellParams) => {
        const expired = params.value && isExpired(params.value);
        const aboutToExpire = params.value && !expired && isAboutToExpire(params.value);
        
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Typography 
              variant="body2" 
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                color: expired ? 'error.main' : 'inherit',
                fontWeight: expired ? 'bold' : 'normal'
              }}
            >
              {params.value ? new Date(params.value).toLocaleDateString() : "-"}
            </Typography>
            {expired && (
              <Chip
                icon={<WarningIcon />}
                label="VENCIDO"
                color="error"
                size="small"
                sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' }, fontWeight: 'bold' }}
              />
            )}
            {aboutToExpire && (
              <Chip
                icon={<WarningIcon />}
                label="Próximo"
                color="warning"
                size="small"
                sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }}
              />
            )}
          </Box>
        );
      },
    },
    {
      field: "quantity_available",
      headerName: "Cantidad",
      flex: 1.2,
      minWidth: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            {params.value}
          </Typography>
          {isLowStock(params.value) && (
            <Chip
              icon={<WarningIcon />}
              label="Bajo"
              color="warning"
              size="small"
              sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }}
            />
          )}
        </Box>
      ),
    },
    { 
      field: "location", 
      headerName: "Ubicación", 
      flex: 1, 
      minWidth: 80,
    },
    {
      field: "purchase_price",
      headerName: "P. Compra",
      flex: 1,
      minWidth: 80,
      valueFormatter: (params) => `$${params || 0}`,
    },
    {
      field: "sale_price",
      headerName: "P. Venta",
      flex: 1,
      minWidth: 80,
      valueFormatter: (params) => `$${params || 0}`,
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
            onClick={() => handleDelete(params.row.inventory_id)}
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
            Inventario
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
            Agregar Item
          </Button>
        </Box>

        {/* Alertas de bajo stock y vencimiento */}
        {(getExpiredItems().length > 0 || getLowStockItems().length > 0 || getExpiringItems().length > 0) && (
          <Box sx={{ mb: 3, display: "flex", flexDirection: "column", gap: 2 }}>
            {getExpiredItems().length > 0 && (
              <Alert 
                severity="error" 
                icon={<WarningIcon />}
                sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  "& .MuiAlert-message": { width: "100%" },
                  bgcolor: 'error.light',
                  color: 'error.contrastText'
                }}
              >
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                    🚨 Productos VENCIDOS ({getExpiredItems().length})
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {getExpiredItems().slice(0, 5).map(item => (
                      <Chip
                        key={item.inventory_id}
                        label={`${getProductName(item.product_id)} - Lote: ${item.batch_number || 'N/A'} (${item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : 'N/A'})`}
                        size="small"
                        sx={{ 
                          bgcolor: 'error.dark',
                          color: 'white',
                          fontWeight: 'bold',
                          '& .MuiChip-label': { fontSize: { xs: '0.6rem', sm: '0.75rem' } }
                        }}
                      />
                    ))}
                    {getExpiredItems().length > 5 && (
                      <Chip
                        label={`+${getExpiredItems().length - 5} más`}
                        size="small"
                        sx={{ 
                          bgcolor: 'error.dark',
                          color: 'white',
                          fontWeight: 'bold',
                          '& .MuiChip-label': { fontSize: { xs: '0.6rem', sm: '0.75rem' } }
                        }}
                      />
                    )}
                  </Box>
                </Box>
              </Alert>
            )}

            {getLowStockItems().length > 0 && (
              <Alert 
                severity="warning" 
                icon={<WarningIcon />}
                sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  "& .MuiAlert-message": { width: "100%" }
                }}
              >
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                    ⚠️ Productos con bajo stock ({getLowStockItems().length})
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {getLowStockItems().slice(0, 5).map(item => (
                      <Chip
                        key={item.inventory_id}
                        label={`${getProductName(item.product_id)} - Lote: ${item.batch_number || 'N/A'} (${item.quantity_available})`}
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    ))}
                    {getLowStockItems().length > 5 && (
                      <Chip
                        label={`+${getLowStockItems().length - 5} más`}
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Box>
              </Alert>
            )}

            {getExpiringItems().length > 0 && (
              <Alert 
                severity="warning" 
                icon={<EventBusyIcon />}
                sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  "& .MuiAlert-message": { width: "100%" }
                }}
              >
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                    📅 Productos próximos a vencer ({getExpiringItems().length})
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {getExpiringItems().slice(0, 5).map(item => (
                      <Chip
                        key={item.inventory_id}
                        label={`${getProductName(item.product_id)} - Lote: ${item.batch_number || 'N/A'} (${item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : 'N/A'})`}
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    ))}
                    {getExpiringItems().length > 5 && (
                      <Chip
                        label={`+${getExpiringItems().length - 5} más`}
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Box>
              </Alert>
            )}
          </Box>
        )}

        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <DataGrid
            rows={inventory}
            columns={columns}
            getRowId={(row) => row.inventory_id}
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

      <InventoryForm
        open={openDialog}
        isEditing={isEditing}
        formData={formData}
        products={products}
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