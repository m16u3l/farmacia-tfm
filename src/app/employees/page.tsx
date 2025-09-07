"use client";
import { useState, useEffect } from "react";
import {
  Box,
  Button,
  IconButton,
  Typography,
  Paper,
  Skeleton,
  Snackbar,
  Alert,
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { Employee, EmployeeFormData } from "@/types/employee";
import { useEmployees } from "@/hooks/useEmployees";

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
        No hay empleados registrados
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Agregue un nuevo empleado usando el botón "Nuevo empleado"
      </Typography>
    </Box>
  );
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<EmployeeFormData>({
    first_name: "",
    last_name: "",
    role: "",
    email: "",
    phone: "",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const { createEmployee, updateEmployee, deleteEmployee } = useEmployees();

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees");
      const data = await response.json();
      setEmployees(data);
      setLoading(false);
    } catch (err) {
      setError("Error al cargar los empleados");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleSubmit = async (data: EmployeeFormData) => {
    try {
      if (isEditing && selectedEmployee) {
        await updateEmployee(selectedEmployee!.employee_id, data);
        setSnackbar({
          open: true,
          message: "Empleado actualizado exitosamente",
          severity: "success",
        });
      } else {
        await createEmployee(data);
        setSnackbar({
          open: true,
          message: "Empleado creado exitosamente",
          severity: "success",
        });
      }
      setOpenDialog(false);
      await fetchEmployees();
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error: ${(error as Error).message}`,
        severity: "error",
      });
    }
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      first_name: employee.first_name,
      last_name: employee.last_name,
      role: employee.role || "",
      email: employee.email || "",
      phone: employee.phone || "",
    });
    setIsEditing(true);
    setOpenDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Está seguro de que desea eliminar este empleado?")) {
      try {
        await deleteEmployee(id);
        setSnackbar({
          open: true,
          message: "Empleado eliminado exitosamente",
          severity: "success",
        });
        await fetchEmployees();
      } catch (error) {
        setSnackbar({
          open: true,
          message: `Error al eliminar el empleado: ${(error as Error).message}`,
          severity: "error",
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      role: "",
      email: "",
      phone: "",
    });
    setIsEditing(false);
  };

  const handleFormChange = (field: keyof EmployeeFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const columns = useEmployeesColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  if (loading && !employees.length) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <Typography color="error" mt={2}>
        {error}
      </Typography>
    );
  }

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <Paper sx={{ p: 3 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography variant="h4">Empleados</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              resetForm();
              setOpenDialog(true);
            }}
          >
            Nuevo empleado
          </Button>
        </Box>

        <Box sx={{ width: "100%" }}>
          <DataGrid
            rows={employees}
            columns={columns}
            getRowId={(row) => row.employee_id}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            pageSizeOptions={[5, 10, 25]}
            disableRowSelectionOnClick
            loading={loading}
            slots={{
              noRowsOverlay: CustomNoRowsOverlay,
            }}
            sx={{
              "& .MuiDataGrid-cell:focus": {
                outline: "none",
              },
              "& .MuiDataGrid-columnHeader": {
                backgroundColor: (theme) => theme.palette.primary.light,
                color: "white",
              },
              "& .MuiDataGrid-row:nth-of-type(even)": {
                backgroundColor: (theme) => theme.palette.action.hover,
              },
              "& .MuiDataGrid-overlay": {
                backgroundColor: "transparent",
              },
            }}
          />
        </Box>

        <EmployeeForm
          open={openDialog}
          isEditing={isEditing}
          formData={formData}
          onClose={() => setOpenDialog(false)}
          onSubmit={handleSubmit}
          onChange={handleFormChange}
        />
      </Paper>

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

function useEmployeesColumns({
  onEdit,
  onDelete,
}: {
  onEdit: (employee: Employee) => void;
  onDelete: (id: number) => void;
}): GridColDef[] {
  return [
    {
      field: "employee_id",
      headerName: "ID",
      flex: 0.5,
      minWidth: 70,
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
      minWidth: 130,
    },
    {
      field: "role",
      headerName: "Cargo",
      flex: 1,
      minWidth: 130,
    },
    {
      field: "email",
      headerName: "Correo",
      flex: 1.5,
      minWidth: 200,
    },
    {
      field: "phone",
      headerName: "Teléfono",
      flex: 1,
      minWidth: 120,
    },
    {
      field: "actions",
      headerName: "Acciones",
      flex: 0.7,
      minWidth: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton
            onClick={() => onEdit(params.row)}
            color="primary"
            size="small"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            onClick={() => onDelete(params.row.employee_id)}
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
