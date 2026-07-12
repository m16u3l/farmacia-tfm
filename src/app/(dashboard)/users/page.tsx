"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  IconButton,
  Typography,
  Paper,
  Skeleton,
  useMediaQuery,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import GroupsIcon from "@mui/icons-material/GroupsOutlined";
import { UserForm } from "@/components/users/UserForm";
import { User, UserFormData } from "@/types/user";
import { Employee } from "@/types/employee";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useUsers } from "@/hooks/useUsers";
import { PageHeader } from "@/components/layout/PageHeader";
import { useConfirmDialog } from "@/components/common/ConfirmDialog";
import { fluidFontSize } from "@/utils/fluidType";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import { ROLE_LABELS } from "@/lib/permissions";

function LoadingState() {
  return (
    <Box sx={{ width: "100%", p: 3 }}>
      <Skeleton height={40} sx={{ mb: 2 }} />
      <Skeleton height={400} />
    </Box>
  );
}

function CustomNoRowsOverlay() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        p: 2,
      }}
    >
      <Typography variant="h6" color="text.secondary">
        No hay usuarios registrados
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Agregue un nuevo usuario usando el botón &quot;Nuevo usuario&quot;
      </Typography>
    </Box>
  );
}

export default function UsersPage() {
  const {
    users,
    isLoading,
    error,
    fetchUsers,
    saveUsuario,
    deleteUsuario,
  } = useUsers();
  const { confirm, confirmDialog } = useConfirmDialog();
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [formData, setFormData] = useState<UserFormData>({
    first_name: "",
    last_name: "",
    email: "",
    role: "cajero",
    is_active: true,
    employee_id: null,
  });

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees");
      const data = await response.json();
      if (response.ok && Array.isArray(data)) setEmployees(data);
    } catch (error) {
      console.error("Error al cargar empleados:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchEmployees();
  }, [fetchUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await saveUsuario(formData, isEditing);
    if (success) {
      setOpenDialog(false);
      resetForm();
    }
  };

  const handleEdit = (usuario: User) => {
    setFormData({ ...usuario, password: "" });
    setIsEditing(true);
    setOpenDialog(true);
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm({
      title: "Eliminar usuario",
      message: "¿Está seguro de eliminar este usuario? Perderá el acceso al sistema.",
    });
    if (confirmed) {
      await deleteUsuario(id);
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      role: "cajero",
      is_active: true,
      employee_id: null,
    });
    setIsEditing(false);
  };

  const handleFormChange = (
    field: keyof UserFormData,
    value: string | boolean | number | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const columns = useUsersColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  if (error) {
    return <ErrorBoundary error={error} reset={fetchUsers} />;
  }

  if (isLoading && !users.length) {
    return <LoadingState />;
  }

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <PageHeader
          title="Usuarios"
          subtitle="Cuentas con acceso al sistema"
          icon={<GroupsIcon />}
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
              Nuevo usuario
            </Button>
          }
        />

        <Alert severity="info" sx={{ mb: 2 }}>
          Un <b>usuario</b> es la cuenta de acceso al sistema (correo, contraseña, rol). Un{" "}
          <b>empleado</b> es la ficha de RR.HH. de la persona. Vincula ambos al crear el
          usuario si esa persona también está en Empleados — no es obligatorio.
        </Alert>

        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <DataGrid
            rows={users}
            columns={columns}
            getRowId={(row) => row.id}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            pageSizeOptions={[5, 10, 25]}
            disableRowSelectionOnClick
            loading={isLoading}
            slots={{
              noRowsOverlay: CustomNoRowsOverlay,
            }}
            columnVisibilityModel={
              isMobile
                ? { id: false, last_name: false, email: false, is_active: false }
                : {}
            }
            sx={{
              "& .MuiDataGrid-cell:focus": {
                outline: "none",
              },
              "& .MuiDataGrid-columnHeader": {
                backgroundColor: (theme) => theme.palette.primary.light,
                color: "white",
                fontSize: fluidFontSize(0.75, 0.875),
              },
              "& .MuiDataGrid-row:nth-of-type(even)": {
                backgroundColor: (theme) => theme.palette.action.hover,
              },
              "& .MuiDataGrid-overlay": {
                backgroundColor: "transparent",
              },
              "& .MuiDataGrid-cell": {
                padding: { xs: '4px', sm: '8px' },
              },
            }}
          />
        </Box>

        {confirmDialog}

        <UserForm
          open={openDialog}
          isEditing={isEditing}
          formData={formData}
          employees={employees}
          onClose={() => setOpenDialog(false)}
          onSubmit={handleSubmit}
          onChange={handleFormChange}
        />
      </Paper>
    </Box>
  );
}

function useUsersColumns({
  onEdit,
  onDelete,
}: {
  onEdit: (usuario: User) => void;
  onDelete: (id: number) => void;
}): GridColDef[] {
  return [
    {
      field: "id",
      headerName: "ID",
      flex: 0.5,
      minWidth: 90,
    },
    {
      field: "first_name",
      headerName: "Nombre",
      flex: 1,
      minWidth: 130,
    },
    {
      field: "last_name",
      headerName: "Apellidos",
      flex: 1,
      minWidth: 200,
    },
    {
      field: "email",
      headerName: "Correo",
      flex: 1.5,
      minWidth: 200,
    },
    {
      field: "role",
      headerName: "Rol",
      flex: 1,
      minWidth: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          size="small"
          label={ROLE_LABELS[params.value as keyof typeof ROLE_LABELS] || params.value}
          color={params.value === "admin" ? "secondary" : "default"}
        />
      ),
    },
    {
      field: "is_active",
      headerName: "Estado",
      flex: 0.8,
      minWidth: 110,
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
      flex: 0.7,
      minWidth: 120,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton
            aria-label="Editar usuario"
            onClick={() => onEdit(params.row)}
            color="primary"
            size="small"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            aria-label="Eliminar usuario"
            onClick={() => onDelete(params.row.id)}
            color="error"
            size="small"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];
}
