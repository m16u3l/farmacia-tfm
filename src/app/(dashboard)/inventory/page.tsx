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
  FormControlLabel,
  Switch,
  TextField,
  MenuItem,
  InputAdornment,
  useMediaQuery,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import WarningIcon from "@mui/icons-material/Warning";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import InventoryIconOutlined from "@mui/icons-material/Inventory2Outlined";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import SearchIcon from "@mui/icons-material/Search";
import { Inventory, InventoryArea, InventoryFormData, Product, TransferReason } from "@/types";
import { InventoryForm } from "@/components/inventory/InventoryForm";
import { TransferDialog } from "@/components/inventory/TransferDialog";
import { useInventory } from "@/hooks/useInventory";
import { PageHeader } from "@/components/layout/PageHeader";
import { useConfirmDialog } from "@/components/common/ConfirmDialog";
import { GridEmptyState } from "@/components/common/GridEmptyState";
import { buildAreaOptions } from "@/utils/areaTree";
import { smartSearch } from "@/utils/smartSearch";
import { fluidFontSize } from "@/utils/fluidType";

const EMPTY_FORM: InventoryFormData = {
  product_id: 0,
  batch_number: null,
  expiry_date: null,
  quantity_available: 0,
  area_id: null,
  purchase_price: 0,
  sale_price: 0,
};

export default function InventoryPage() {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [areas, setAreas] = useState<InventoryArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);
  const [formData, setFormData] = useState<InventoryFormData>(EMPTY_FORM);
  const [transferItem, setTransferItem] = useState<Inventory | null>(null);
  const [showOutOfStock, setShowOutOfStock] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [expandedAlert, setExpandedAlert] = useState({ expired: false, lowStock: false, expiring: false });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const { createInventoryItem, updateInventoryItem, deleteInventoryItem, transferInventoryItem } = useInventory();
  const { confirm, confirmDialog } = useConfirmDialog();
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));

  const fetchInventory = async () => {
    try {
      const response = await fetch("/api/inventory");
      const data = await response.json();
      if (!response.ok) {
        setError(typeof data === "object" && data && "error" in data ? String(data.error) : "Error al cargar el inventario");
        setInventory([]);
      } else if (Array.isArray(data)) {
        setInventory(data);
      } else {
        setError("Respuesta inesperada del servidor al cargar inventario");
        setInventory([]);
      }
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
      if (!response.ok) {
        console.error("Error al cargar productos:", data);
        setProducts([]);
      } else if (Array.isArray(data)) {
        setProducts(data);
      } else {
        console.error("Respuesta inesperada del servidor al cargar productos:", data);
        setProducts([]);
      }
    } catch {
      console.error("Error al cargar productos");
    }
  };

  const fetchAreas = async () => {
    try {
      const response = await fetch("/api/inventory-areas");
      const data = await response.json();
      if (!response.ok) {
        console.error("Error al cargar áreas:", data);
        setAreas([]);
      } else if (Array.isArray(data)) {
        setAreas(data);
      } else {
        console.error("Respuesta inesperada del servidor al cargar áreas:", data);
        setAreas([]);
      }
    } catch {
      console.error("Error al cargar áreas");
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchProducts();
    fetchAreas();
  }, []);

  const handleAdd = () => {
    setIsEditing(false);
    setSelectedItem(null);
    setFormData(EMPTY_FORM);
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
      area_id: item.area_id,
      purchase_price: item.purchase_price,
      sale_price: item.sale_price,
    });
    setOpenDialog(true);
  };

  const handleOpenTransfer = (item: Inventory) => {
    setTransferItem(item);
  };

  const handleTransfer = async (data: { destination_area_id: number; quantity: number; reason: TransferReason; notes?: string }) => {
    if (!transferItem) return;
    const result = await transferInventoryItem(transferItem.inventory_id, data);
    if (result) {
      setSnackbar({ open: true, message: "Transferencia realizada correctamente", severity: "success" });
      setTransferItem(null);
      fetchInventory();
    } else {
      setSnackbar({ open: true, message: "Error al transferir el elemento", severity: "error" });
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm({
      title: "Eliminar lote de inventario",
      message: "¿Estás seguro de que quieres eliminar este lote? Esta acción no se puede deshacer.",
    });
    if (confirmed) {
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
    return quantity > 0 && quantity <= 10; // Bajo stock: 10 o menos, sin contar agotados
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
    return inventory.filter(item => item.quantity_available > 0 && item.expiry_date && isAboutToExpire(item.expiry_date));
  };

  const getExpiredItems = () => {
    return inventory.filter(item => item.quantity_available > 0 && item.expiry_date && isExpired(item.expiry_date));
  };

  const outOfStockCount = inventory.filter(item => item.quantity_available === 0).length;
  const filteredInventory = inventory.filter((item) => {
    if (!showOutOfStock && item.quantity_available <= 0) return false;
    if (areaFilter !== "all" && String(item.area_id ?? "") !== areaFilter) return false;
    return true;
  });
  const visibleInventory = smartSearch(filteredInventory, searchText, (item) => [
    item.product_name || getProductName(item.product_id),
    item.product_active_ingredient,
    item.batch_number,
    item.product_barcode,
    item.product_laboratory,
    item.product_concentration,
    item.product_category,
  ]);

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
                fontSize: fluidFontSize(0.75, 0.875),
                color: expired ? 'error.main' : 'inherit',
                fontWeight: expired ? 'bold' : 'normal'
              }}
            >
              {params.value ? formatDate(params.value) : "-"}
            </Typography>
            {expired && (
              <Chip
                icon={<WarningIcon />}
                label="VENCIDO"
                color="error"
                size="small"
                sx={{ fontSize: fluidFontSize(0.6, 0.75), fontWeight: 'bold' }}
              />
            )}
            {aboutToExpire && (
              <Chip
                icon={<WarningIcon />}
                label="Próximo"
                color="warning"
                size="small"
                sx={{ fontSize: fluidFontSize(0.6, 0.75) }}
              />
            )}
            {params.row.expiry_is_approximate && (
              <Chip
                label="Fecha aprox."
                variant="outlined"
                size="small"
                sx={{ fontSize: fluidFontSize(0.6, 0.75) }}
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
          <Typography variant="body2" sx={{ fontSize: fluidFontSize(0.75, 0.875) }}>
            {params.value}
          </Typography>
          {isLowStock(params.value) && (
            <Chip
              icon={<WarningIcon />}
              label="Bajo"
              color="warning"
              size="small"
              sx={{ fontSize: fluidFontSize(0.6, 0.75) }}
            />
          )}
        </Box>
      ),
    },
    {
      field: "area_name",
      headerName: "Ubicación",
      flex: 1,
      minWidth: 80,
      valueFormatter: (params) => params || "Sin asignar",
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
      width: 160,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <IconButton
            aria-label="Transferir lote"
            size="small"
            onClick={() => handleOpenTransfer(params.row)}
            color="primary"
            title="Transferir"
          >
            <SwapHorizIcon />
          </IconButton>
          <IconButton
            aria-label="Editar lote"
            size="small"
            onClick={() => handleEdit(params.row)}
            color="primary"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            aria-label="Eliminar lote"
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
    <Box sx={{ width: "100%", height: "100%" }}>
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 4 }}>
        <PageHeader
          title="Inventario"
          subtitle="Control de lotes, existencias y vencimientos"
          icon={<InventoryIconOutlined />}
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
              Agregar Item
            </Button>
          }
        />

        {/* Alertas de bajo stock y vencimiento */}
        {(getExpiredItems().length > 0 || getLowStockItems().length > 0 || getExpiringItems().length > 0) && (
          <Box sx={{ mb: 3, display: "flex", flexDirection: "column", gap: 2 }}>
            {getExpiredItems().length > 0 && (
              <Alert 
                severity="error" 
                icon={<WarningIcon />}
                sx={{ 
                  fontSize: fluidFontSize(0.75, 0.875),
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
                    {(expandedAlert.expired ? getExpiredItems() : getExpiredItems().slice(0, 5)).map(item => (
                      <Chip
                        key={item.inventory_id}
                        label={`${getProductName(item.product_id)} - Lote: ${item.batch_number || 'N/A'} (${item.expiry_date ? formatDate(item.expiry_date) : 'N/A'})`}
                        size="small"
                        sx={{
                          bgcolor: 'error.dark',
                          color: 'white',
                          fontWeight: 'bold',
                          '& .MuiChip-label': { fontSize: fluidFontSize(0.6, 0.75) }
                        }}
                      />
                    ))}
                    {getExpiredItems().length > 5 && (
                      <Chip
                        label={expandedAlert.expired ? "Ver menos" : `+${getExpiredItems().length - 5} más`}
                        size="small"
                        onClick={() => setExpandedAlert((prev) => ({ ...prev, expired: !prev.expired }))}
                        sx={{
                          bgcolor: 'error.dark',
                          color: 'white',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          '& .MuiChip-label': { fontSize: fluidFontSize(0.6, 0.75) }
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
                  fontSize: fluidFontSize(0.75, 0.875),
                  "& .MuiAlert-message": { width: "100%" }
                }}
              >
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                    ⚠️ Productos con bajo stock ({getLowStockItems().length})
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {(expandedAlert.lowStock ? getLowStockItems() : getLowStockItems().slice(0, 5)).map(item => (
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
                        label={expandedAlert.lowStock ? "Ver menos" : `+${getLowStockItems().length - 5} más`}
                        size="small"
                        color="warning"
                        variant="outlined"
                        onClick={() => setExpandedAlert((prev) => ({ ...prev, lowStock: !prev.lowStock }))}
                        sx={{ cursor: 'pointer' }}
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
                  fontSize: fluidFontSize(0.75, 0.875),
                  "& .MuiAlert-message": { width: "100%" }
                }}
              >
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                    📅 Productos próximos a vencer ({getExpiringItems().length})
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {(expandedAlert.expiring ? getExpiringItems() : getExpiringItems().slice(0, 5)).map(item => (
                      <Chip
                        key={item.inventory_id}
                        label={`${getProductName(item.product_id)} - Lote: ${item.batch_number || 'N/A'} (${item.expiry_date ? formatDate(item.expiry_date) : 'N/A'})`}
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    ))}
                    {getExpiringItems().length > 5 && (
                      <Chip
                        label={expandedAlert.expiring ? "Ver menos" : `+${getExpiringItems().length - 5} más`}
                        size="small"
                        color="warning"
                        variant="outlined"
                        onClick={() => setExpandedAlert((prev) => ({ ...prev, expiring: !prev.expiring }))}
                        sx={{ cursor: 'pointer' }}
                      />
                    )}
                  </Box>
                </Box>
              </Alert>
            )}
          </Box>
        )}

        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            mb: 1,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <TextField
            size="small"
            placeholder="Buscar por nombre, principio activo, lote, código…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ flex: "1 1 220px" }}
          />
          <TextField
            select
            size="small"
            label="Área"
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            sx={{ flex: "0 1 200px", minWidth: 150 }}
          >
            <MenuItem value="all">Todas las áreas</MenuItem>
            {buildAreaOptions(areas).map(({ area, depth }) => (
              <MenuItem key={area.area_id} value={String(area.area_id)}>
                {`${"— ".repeat(depth)}${area.name}`}
              </MenuItem>
            ))}
          </TextField>
          <FormControlLabel
            control={
              <Switch
                checked={showOutOfStock}
                onChange={(e) => setShowOutOfStock(e.target.checked)}
                size="small"
              />
            }
            label={`Mostrar agotados${outOfStockCount > 0 ? ` (${outOfStockCount})` : ""}`}
            sx={{ ml: "auto", "& .MuiFormControlLabel-label": { fontSize: fluidFontSize(0.75, 0.875) } }}
          />
        </Box>

        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <DataGrid
            slots={{
              noRowsOverlay: () => (
                <GridEmptyState
                  message="No hay lotes de inventario todavía"
                  actionLabel="Agregar lote"
                  onAction={handleAdd}
                />
              ),
            }}
            rows={visibleInventory}
            columns={columns}
            getRowId={(row) => row.inventory_id}
            loading={loading}
            autoHeight
            pageSizeOptions={[5, 10, 25]}
            disableRowSelectionOnClick
            columnVisibilityModel={
              isMobile
                ? {
                    inventory_id: false,
                    batch_number: false,
                    expiry_date: false,
                    area_name: false,
                    purchase_price: false,
                    sale_price: false,
                  }
                : {}
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

      {confirmDialog}

      <InventoryForm
        open={openDialog}
        isEditing={isEditing}
        formData={formData}
        products={products}
        areas={areas}
        onClose={() => setOpenDialog(false)}
        onSubmit={handleSubmit}
        onChange={handleFormChange}
      />

      <TransferDialog
        open={!!transferItem}
        item={transferItem}
        areas={areas}
        onClose={() => setTransferItem(null)}
        onSubmit={handleTransfer}
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