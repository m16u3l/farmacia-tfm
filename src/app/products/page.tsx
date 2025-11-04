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
import { Product, ProductFormData } from "@/types/products";
// Date utilities removed as they're not used
import { ProductForm } from "@/components/products/ProductForm";
import { useProducts } from "@/hooks/useProducts";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    category: "",
    type: "",
    dosage_form: "",
    unit: "",
    barcode: "",
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
      category: product.category ?? "",
      type: product.type ?? "",
      dosage_form: product.dosage_form ?? "",
      unit: product.unit ?? "",
      barcode: product.barcode ?? "",
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
      category: "",
      type: "",
      dosage_form: "",
      unit: "",
      barcode: "",
      status: true
    });
    setIsEditing(false);
  };

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const columns: GridColDef[] = [
    { field: "product_id", headerName: "ID", flex: 0.5, minWidth: 50, maxWidth: 70 },
    { field: "name", headerName: "Nombre", flex: 2, minWidth: 150 },
    { field: "description", headerName: "Descripción", flex: 2.5, minWidth: 180 },
    { field: "category", headerName: "Categoría", flex: 1.5, minWidth: 120 },
    { field: "type", headerName: "Tipo", flex: 1, minWidth: 100 },
    { field: "dosage_form", headerName: "Forma", flex: 1, minWidth: 100 },
    { field: "unit", headerName: "Unidad", flex: 1, minWidth: 80 },
    { field: "barcode", headerName: "Código", flex: 1.2, minWidth: 100 },
    {
      field: "status",
      headerName: "Estado",
      flex: 1,
      minWidth: 80,
      renderCell: (params: GridRenderCellParams) => (
        <Typography 
          color={params.value ? "success.main" : "error.main"}
          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
        >
          {params.value ? "Activo" : "Inactivo"}
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
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
          flexDirection={{ xs: "column", sm: "row" }}
          gap={{ xs: 2, sm: 0 }}
        >
          <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            Productos
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
            Nuevo producto
          </Button>
        </Box>
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

      <ProductForm
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
