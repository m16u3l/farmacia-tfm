"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Paper, Button, Snackbar, Alert, Tab, Tabs, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import type { LayoutItem } from "react-grid-layout";
import { AreaLayoutItem, InventoryArea, InventoryAreaFormData } from "@/types";
import { AreaForm } from "@/components/areas/AreaForm";
import { useAreas } from "@/hooks/useAreas";
import { PageHeader } from "@/components/layout/PageHeader";
import { useConfirmDialog } from "@/components/common/ConfirmDialog";
import { areasToLayout, nextFreeSlotClient } from "@/utils/areaMap";
import { AreaMapTab } from "./_components/AreaMapTab";
import { AreasListTab } from "./_components/AreasListTab";

const EMPTY_FORM: InventoryAreaFormData = {
  name: "",
  type: "otro",
  parent_area_id: null,
  is_active: true,
};

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  if (value !== index) return null;
  return <Box sx={{ pt: 2 }}>{children}</Box>;
}

function AreasContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingAreaId, setEditingAreaId] = useState<number | null>(null);
  const [formData, setFormData] = useState<InventoryAreaFormData>(EMPTY_FORM);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const { areas, loading, error, fetchAreas, createArea, updateArea, deleteArea, saveLayout } = useAreas();
  const { confirm, confirmDialog } = useConfirmDialog();

  // Pestaña y nivel viven en la URL para que recargar o volver atrás no pierda
  // el contexto del mapa.
  const tabValue = searchParams.get("tab") === "lista" ? 1 : 0;
  const nivel = searchParams.get("nivel");
  const currentParentId = nivel ? Number(nivel) : null;

  const setParams = (next: { tab?: string; nivel?: number | null }) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next.tab !== undefined) params.set("tab", next.tab);
    if (next.nivel !== undefined) {
      if (next.nivel === null) params.delete("nivel");
      else params.set("nivel", String(next.nivel));
    }
    router.replace(`/areas?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    fetchAreas();
  }, [fetchAreas]);

  const handleAdd = (parentAreaId: number | null = null) => {
    setIsEditing(false);
    setEditingAreaId(null);
    setFormData({ ...EMPTY_FORM, parent_area_id: parentAreaId });
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
    const confirmed = await confirm({
      title: "Eliminar área",
      message: "¿Estás seguro de que quieres eliminar esta área de inventario?",
    });
    if (confirmed) {
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
      isEditing && editingAreaId ? await updateArea(editingAreaId, data) : await createArea(data);

    if (result) {
      setSnackbar({
        open: true,
        message: isEditing ? "Área actualizada correctamente" : "Área creada correctamente",
        severity: "success",
      });
      setOpenDialog(false);
      fetchAreas();
    } else {
      setSnackbar({ open: true, message: error || "Error al guardar el área", severity: "error" });
    }
  };

  /**
   * Guarda la geometría del nivel visible junto con las áreas que el usuario
   * sacó de él arrastrándolas: a esas hay que darles una posición libre en su
   * nivel destino antes de mandarlas.
   */
  const handleSaveLayout = async (
    layout: LayoutItem[],
    parentId: number | null,
    reparented: Map<number, number | null>
  ): Promise<boolean> => {
    const items: AreaLayoutItem[] = layout.map((item) => ({
      area_id: Number(item.i),
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      parent_area_id: parentId,
    }));

    for (const [areaId, destinationId] of reparented) {
      const area = areas.find((a) => a.area_id === areaId);
      if (!area) continue;
      const slot = nextFreeSlotClient(areasToLayout(areas, destinationId), area.type);
      items.push({ area_id: areaId, ...slot, parent_area_id: destinationId });
    }

    const result = await saveLayout(items);
    setSnackbar({
      open: true,
      message: result ? "Mapa guardado correctamente" : error || "Error al guardar el mapa",
      severity: result ? "success" : "error",
    });
    return !!result;
  };

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <PageHeader
          title="Áreas de Inventario"
          subtitle="Sucursales, almacenes y estantes donde se ubica el inventario"
          icon={<AccountTreeOutlinedIcon />}
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleAdd(tabValue === 0 ? currentParentId : null)}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              Agregar Área
            </Button>
          }
        />

        <Tabs
          value={tabValue}
          onChange={(_, value) => setParams({ tab: value === 1 ? "lista" : "mapa" })}
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="Mapa" />
          <Tab label="Lista" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <AreaMapTab
            areas={areas}
            loading={loading}
            error={error}
            currentParentId={currentParentId}
            onNavigate={(parentId) => setParams({ nivel: parentId })}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleAdd}
            onSaveLayout={handleSaveLayout}
            onRetry={fetchAreas}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <AreasListTab areas={areas} loading={loading} onEdit={handleEdit} onDelete={handleDelete} />
          {error && (
            <Typography color="error" mt={2}>
              {error}
            </Typography>
          )}
        </TabPanel>
      </Paper>

      {confirmDialog}

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
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// useSearchParams obliga a un límite de Suspense (mismo patrón que /login).
export default function AreasPage() {
  return (
    <Suspense fallback={null}>
      <AreasContent />
    </Suspense>
  );
}
