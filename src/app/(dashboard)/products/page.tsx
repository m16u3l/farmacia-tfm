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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import StorefrontIcon from "@mui/icons-material/StorefrontOutlined";
import { Product, ProductFormData, SaleControl, SALE_CONTROL_LABELS } from "@/types/products";
// Date utilities removed as they're not used
import { ProductForm } from "@/components/products/ProductForm";
import { useProducts } from "@/hooks/useProducts";
import { PageHeader } from "@/components/layout/PageHeader";
import { fluidFontSize } from "@/utils/fluidType";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    possible_uses: "",
    additional_info: "",
    laboratory: "",
    active_ingredient: "",
    concentration: "",
    health_registry: "",
    category: "",
    type: "",
    dosage_form: "",
    unit: "",
    barcode: "",
    sale_control: "libre",
    status: true
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const { createProduct, updateProduct, deleteProduct } = useProducts();

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();
      if (!response.ok) {
        setError(typeof data === "object" && data && "error" in data ? String(data.error) : "Error al cargar los productos");
        setProducts([]);
      } else if (Array.isArray(data)) {
        setProducts(data);
      } else {
        setError("Respuesta inesperada del servidor al cargar productos");
        setProducts([]);
      }
      setLoading(false);
    } catch {
      setError("Error al cargar los productos");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name ?? "",
      description: product.description ?? "",
      possible_uses: product.possible_uses ?? "",
      additional_info: product.additional_info ?? "",
      laboratory: product.laboratory ?? "",
      active_ingredient: product.active_ingredient ?? "",
      concentration: product.concentration ?? "",
      health_registry: product.health_registry ?? "",
      category: product.category ?? "",
      type: product.type ?? "",
      dosage_form: product.dosage_form ?? "",
      unit: product.unit ?? "",
      barcode: product.barcode ?? "",
      sale_control: product.sale_control ?? "libre",
      status: product.status
    });
    setIsEditing(true);
    setOpenDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Está seguro de que desea eliminar este producto?")) {
      try {
        await deleteProduct(id);
        setSnackbar({
          open: true,
          message: "Producto eliminado exitosamente",
          severity: "success",
        });
        await fetchProducts();
      } catch (error) {
        setSnackbar({
          open: true,
          message: `Error al eliminar el producto: ${(error as Error).message}`,
          severity: "error",
        });
      }
    }
  };

  const handleFormChange = (
    field: keyof ProductFormData,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (data: ProductFormData) => {
    try {
      if (isEditing) {
        await updateProduct(selectedProduct!.product_id, data);
        setSnackbar({
          open: true,
          message: "Producto actualizado exitosamente",
          severity: "success",
        });
      } else {
        await createProduct(data);
        setSnackbar({
          open: true,
          message: "Producto creado exitosamente",
          severity: "success",
        });
      }
      setOpenDialog(false);
      await fetchProducts();
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
      name: "",
      description: "",
      possible_uses: "",
      additional_info: "",
      laboratory: "",
      active_ingredient: "",
      concentration: "",
      health_registry: "",
      category: "",
      type: "",
      dosage_form: "",
      unit: "",
      barcode: "",
      sale_control: "libre",
      status: true
    });
    setIsEditing(false);
  };

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  const columns: GridColDef[] = [
    { field: "product_id", headerName: "ID", flex: 0.5, minWidth: 50, maxWidth: 70 },
    { field: "name", headerName: "Nombre", flex: 2, minWidth: 150 },
    { field: "laboratory", headerName: "Laboratorio", flex: 1.5, minWidth: 120 },
    { field: "active_ingredient", headerName: "Principio activo", flex: 1.5, minWidth: 130 },
    { field: "concentration", headerName: "Concentración", flex: 1, minWidth: 100 },
    { field: "description", headerName: "Descripción", flex: 2.5, minWidth: 180 },
    { field: "category", headerName: "Categoría", flex: 1.5, minWidth: 120 },
    { field: "type", headerName: "Tipo", flex: 1, minWidth: 100 },
    { field: "dosage_form", headerName: "Forma", flex: 1, minWidth: 100 },
    { field: "unit", headerName: "Unidad", flex: 1, minWidth: 80 },
    { field: "barcode", headerName: "Código", flex: 1.2, minWidth: 100 },
    {
      field: "sale_control",
      headerName: "Control de venta",
      flex: 1.3,
      minWidth: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          size="small"
          label={SALE_CONTROL_LABELS[params.value as SaleControl] ?? params.value}
          color={
            params.value === "controlado"
              ? "error"
              : params.value === "receta"
              ? "warning"
              : "default"
          }
          variant={params.value === "libre" ? "outlined" : "filled"}
        />
      ),
    },
    {
      field: "status",
      headerName: "Estado",
      flex: 1,
      minWidth: 80,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          size="small"
          label={params.value ? "Activo" : "Inactivo"}
          color={params.value ? "success" : "default"}
          variant={params.value ? "filled" : "outlined"}
        />
      ),
    },
    {
      field: "actions",
      headerName: "Acciones",
      flex: 0.9,
      minWidth: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton
            color="default"
            size="small"
            onClick={() => setDetailProduct(params.row)}
          >
            <VisibilityIcon />
          </IconButton>
          <IconButton
            color="primary"
            size="small"
            onClick={() => {
              setSelectedProduct(params.row);
              handleEdit(params.row);
            }}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            color="error"
            size="small"
            onClick={() => handleDelete(params.row.product_id)}
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
        <PageHeader
          title="Productos"
          subtitle="Catálogo de medicamentos y artículos de la farmacia"
          icon={<StorefrontIcon />}
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
              Nuevo producto
            </Button>
          }
        />
        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <DataGrid
            rows={products}
            columns={columns}
            getRowId={(row) => row.product_id}
            loading={loading}
            autoHeight
            pageSizeOptions={[5, 10, 25]}
            disableRowSelectionOnClick
            sx={{
              minWidth: 800,
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
        {error && (
          <Typography color="error" mt={2}>
            {error}
          </Typography>
        )}
      </Paper>

      <ProductForm
        open={openDialog}
        isEditing={isEditing}
        formData={formData}
        onClose={() => setOpenDialog(false)}
        onSubmit={handleSubmit}
        onChange={handleFormChange}
      />

      <Dialog
        open={detailProduct !== null}
        onClose={() => setDetailProduct(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{detailProduct?.name}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Laboratorio
                </Typography>
                <Typography variant="body2">
                  {detailProduct?.laboratory || "No especificado"}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Principio activo
                </Typography>
                <Typography variant="body2">
                  {detailProduct?.active_ingredient || "No especificado"}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Concentración
                </Typography>
                <Typography variant="body2">
                  {detailProduct?.concentration || "No especificada"}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Registro sanitario
                </Typography>
                <Typography variant="body2">
                  {detailProduct?.health_registry || "No especificado"}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Control de venta
                </Typography>
                <Chip
                  size="small"
                  label={SALE_CONTROL_LABELS[detailProduct?.sale_control ?? "libre"]}
                  color={
                    detailProduct?.sale_control === "controlado"
                      ? "error"
                      : detailProduct?.sale_control === "receta"
                      ? "warning"
                      : "default"
                  }
                  variant={detailProduct?.sale_control === "libre" || !detailProduct?.sale_control ? "outlined" : "filled"}
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Descripción
              </Typography>
              <Typography variant="body2">
                {detailProduct?.description || "Sin descripción"}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Posibles usos
              </Typography>
              <Typography variant="body2">
                {detailProduct?.possible_uses || "Sin información"}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Información adicional
              </Typography>
              <Typography variant="body2">
                {detailProduct?.additional_info || "Sin información"}
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailProduct(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

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
