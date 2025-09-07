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
import {
  formatDisplayDate,
  formatInputDate,
  parseInputDate,
} from "@/utils/dateUtils";
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
      setProducts(data);
      setLoading(false);
    } catch (err) {
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
    { field: "product_id", headerName: "ID", flex: 0.5, minWidth: 80 },
    { field: "name", headerName: "Nombre", flex: 1.2, minWidth: 150 },
    {
      field: "description",
      headerName: "Descripción",
      flex: 1.5,
      minWidth: 200,
    },
    {
      field: "category",
      headerName: "Categoría",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "type",
      headerName: "Tipo",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "dosage_form",
      headerName: "Forma farmacéutica",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "unit",
      headerName: "Unidad",
      flex: 0.7,
      minWidth: 100,
    },
    {
      field: "barcode",
      headerName: "Código de barras",
      flex: 1,
      minWidth: 120,
    },
    {
      field: "status",
      headerName: "Estado",
      flex: 0.7,
      minWidth: 100,
      renderCell: (params) => (
        <Typography color={params.row.status ? "primary" : "error"}>
          {params.row.status ? "Activo" : "Inactivo"}
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
    <Box sx={{ width: "100%", height: "100%" }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography variant="h4">Productos</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              resetForm();
              setOpenDialog(true);
            }}
          >
            Nuevo producto
          </Button>
        </Box>
        <Box sx={{ width: "100%" }}>
          <DataGrid
            rows={products}
            columns={columns}
            getRowId={(row) => row.product_id}
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
