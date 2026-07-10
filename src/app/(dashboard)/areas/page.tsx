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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import { InventoryArea, InventoryAreaFormData } from "@/types";
import { AreaForm } from "@/components/areas/AreaForm";
import { useAreas } from "@/hooks/useAreas";
import { PageHeader } from "@/components/layout/PageHeader";
import { buildAreaOptions } from "@/utils/areaTree";

const EMPTY_FORM: InventoryAreaFormData = {
  name: "",
  type: "otro",
  parent_area_id: null,
  is_active: true,
};

export default function AreasPage() {
  const [areas, setAreas] = useState<InventoryArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingAreaId, setEditingAreaId] = useState<number | null>(null);
  const [formData, setFormData] = useState<InventoryAreaFormData>(EMPTY_FORM);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const { createArea, updateArea, deleteArea } = useAreas();

  const fetchAreas = async () => {
    try {
      const response = await fetch("/api/inventory-areas");
      const data = await response.json();
      if (!response.ok) {
        setError(typeof data === "object" && data && "error" in data ? String(data.error) : "Error al cargar las áreas");
        setAreas([]);
      } else if (Array.isArray(data)) {
        setAreas(data);
      } else {
        setError("Respuesta inesperada del servidor al cargar áreas");
        setAreas([]);
      }
      setLoading(false);
    } catch {
      setError("Error al cargar las áreas");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  const handleAdd = () => {
    setIsEditing(false);
    setEditingAreaId(null);
    setFormData(EMPTY_FORM);
    setOpenDialog(true);
  };

  const handleEdit = (area: InventoryArea) => {
    setIsEditing(true);
    setEditingAreaId(area.area_id);
    setFormData({
      name: area.name,
      type: area.type,
      parent_area_id: area.parent_area_id,
      is_active: area.is_active,
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta área?")) {
      const success = await deleteArea(id);
      if (success) {
        setSnackbar({ open: true, message: "Área eliminada correctamente", severity: "success" });
        fetchAreas();
      } else {
        setSnackbar({ open: true, message: "Error al eliminar el área", severity: "error" });
      }
    }
  };

  const handleFormChange = (field: keyof InventoryAreaFormData, value: string | number | boolean | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (data: InventoryAreaFormData) => {
    if (!data.name.trim()) {
      setSnackbar({ open: true, message: "El nombre del área es obligatorio", severity: "error" });
      return;
    }

    const result =
      isEditing && editingAreaId
        ? await updateArea(editingAreaId, data)
        : await createArea(data);

    if (result) {
      setSnackbar({
        open: true,
        message: isEditing ? "Área actualizada correctamente" : "Área creada correctamente",
        severity: "success",
      });
      setOpenDialog(false);
      fetchAreas();
    } else {
      setSnackbar({ open: true, message: "Error al guardar el área", severity: "error" });
    }
  };

  const treeOptions = buildAreaOptions(areas);

  return (
    <Box sx={{ width: "100%", height: "100%", p: { xs: 1, sm: 3 } }}>
      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <PageHeader
          title="Áreas de Inventario"
          subtitle="Sucursales, almacenes y estantes donde se ubica el inventario"
          icon={<AccountTreeOutlinedIcon />}
          action={
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
              Agregar Área
            </Button>
          }
        />

        <TableContainer sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "primary.light" }}>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Nombre</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Tipo</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Estado</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {treeOptions.map(({ area, depth }) => (
                <TableRow key={area.area_id} sx={{ "&:nth-of-type(even)": { bgcolor: "action.hover" } }}>
                  <TableCell sx={{ pl: 2 + depth * 3 }}>{area.name}</TableCell>
                  <TableCell>{area.type}</TableCell>
                  <TableCell>
                    <Chip
                      label={area.is_active ? "Activa" : "Inactiva"}
                      color={area.is_active ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleEdit(area)} color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(area.area_id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && treeOptions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography color="text.secondary" align="center">
                      No hay áreas creadas todavía.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {error && (
          <Typography color="error" mt={2}>
            {error}
          </Typography>
        )}
      </Paper>

      <AreaForm
        open={openDialog}
        isEditing={isEditing}
        editingAreaId={editingAreaId}
        formData={formData}
        areas={areas}
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
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
