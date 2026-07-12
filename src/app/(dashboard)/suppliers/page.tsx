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
  useMediaQuery,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LocalShippingIcon from "@mui/icons-material/LocalShippingOutlined";
import { Supplier, SupplierFormData } from "@/types";
import { SupplierForm } from "@/components/suppliers/SupplierForm";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { PageHeader } from "@/components/layout/PageHeader";
import { useConfirmDialog } from "@/components/common/ConfirmDialog";
import { fluidFontSize } from "@/utils/fluidType";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<SupplierFormData>({
    name: "",
    contact_name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const { createSupplier, updateSupplier, deleteSupplier } = useSuppliers();
  const { confirm, confirmDialog } = useConfirmDialog();
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));
  const { user } = useCurrentUser();
  // Los proveedores solo puede editarlos un administrador (la API también lo exige).
  const isAdmin = user?.role === "admin";

  const fetchSuppliers = async () => {
    try {
      const response = await fetch("/api/suppliers");
      const data = await response.json();
      setSuppliers(data);
      setLoading(false);
    } catch {
      setError("Error al cargar los proveedores");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);
  
  const handleEdit = (supplier: Supplier) => {
    setFormData({
      name: supplier.name ?? "",
      contact_name: supplier.contact_name ?? "",
      phone: supplier.phone ?? "",
      email: supplier.email ?? "",
      address: supplier.address ?? "",
    });
    setSelectedSupplier(supplier);
    setIsEditing(true);
    setOpenDialog(true);
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm({
      title: "Eliminar proveedor",
      message: "¿Está seguro de que desea eliminar este proveedor? Esta acción no se puede deshacer.",
    });
    if (confirmed) {
      try {
        await deleteSupplier(id);
        setSnackbar({
          open: true,
          message: "Proveedor eliminado exitosamente",
          severity: "success",
        });
        await fetchSuppliers();
      } catch (error) {
        setSnackbar({
          open: true,
          message: `Error al eliminar el proveedor: ${(error as Error).message}`,
          severity: "error",
        });
      }
    }
  };

  const handleFormChange = (
    field: keyof SupplierFormData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (data: SupplierFormData) => {
    try {
      if (isEditing) {
        await updateSupplier(selectedSupplier!.supplier_id, data);
        setSnackbar({
          open: true,
          message: "Proveedor actualizado exitosamente",
          severity: "success",
        });
      } else {
        await createSupplier(data);
        setSnackbar({
          open: true,
          message: "Proveedor creado exitosamente",
          severity: "success",
        });
      }
      setOpenDialog(false);
      await fetchSuppliers();
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
      contact_name: "",
      phone: "",
      email: "",
      address: "",
    });
    setIsEditing(false);
    setSelectedSupplier(null);
  };

  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const columns: GridColDef[] = [
    { field: "supplier_id", headerName: "ID", flex: 0.5, minWidth: 50, maxWidth: 70 },
    { field: "name", headerName: "Nombre", flex: 2, minWidth: 150 },
    { field: "contact_name", headerName: "Contacto", flex: 1.8, minWidth: 140 },
    { field: "phone", headerName: "Teléfono", flex: 1.5, minWidth: 120 },
    { field: "email", headerName: "Email", flex: 2, minWidth: 160 },
    { field: "address", headerName: "Dirección", flex: 2.5, minWidth: 180 },
    {
      field: "actions",
      headerName: "Acciones",
      flex: 0.7,
      minWidth: 120,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton
            aria-label="Editar proveedor"
            color="primary"
            size="small"
            onClick={() => {
              handleEdit(params.row);
            }}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            aria-label="Eliminar proveedor"
            color="error"
            size="small"
            onClick={() => handleDelete(params.row.supplier_id)}
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
          title="Proveedores"
          subtitle="Empresas y contactos que abastecen a la farmacia"
          icon={<LocalShippingIcon />}
          action={
            isAdmin ? (
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
                Nuevo proveedor
              </Button>
            ) : undefined
          }
        />
        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <DataGrid
            rows={suppliers}
            columns={columns}
            getRowId={(row) => row.supplier_id}
            loading={loading}
            autoHeight
            pageSizeOptions={[5, 10, 25]}
            disableRowSelectionOnClick
            columnVisibilityModel={{
              ...(isMobile
                ? { supplier_id: false, contact_name: false, email: false, address: false }
                : {}),
              ...(isAdmin ? {} : { actions: false }),
            }}
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

      <SupplierForm
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
