"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Alert, Box, Skeleton, useMediaQuery } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { Layout, LayoutItem } from "react-grid-layout";
import { AreaCoverage, InventoryArea } from "@/types";
import { useValidations } from "@/hooks/useValidations";
import { useConfirmDialog } from "@/components/common/ConfirmDialog";
import { GridEmptyState } from "@/components/common/GridEmptyState";
import {
  areasToLayout,
  childrenOf,
  DESIGN_WIDTH,
  hasCollision,
  isDescendant,
  levelBounds,
  mapHeight,
  MAX_MAP_DEPTH,
  pathTo,
  sameLayout,
} from "@/utils/areaMap";
import { AreaMapBreadcrumb } from "./AreaMapBreadcrumb";
import { AreaMapCard } from "./AreaMapCard";
import { AreaMapToolbar } from "./AreaMapToolbar";
import { AreaSheet } from "./AreaSheet";
import { MoveAreaDialog } from "./MoveAreaDialog";

// react-grid-layout mide el DOM al montarse, así que no puede correr en el
// servidor sin provocar un desajuste de hidratación.
const AreaMapGrid = dynamic(() => import("./AreaMapGrid"), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

function MapSkeleton() {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} variant="rounded" height={140} sx={{ flex: "1 1 30%", minWidth: 180 }} />
      ))}
    </Box>
  );
}

/** Coordenadas del puntero, tanto con ratón como con el dedo. */
function pointerPosition(event: Event): { x: number; y: number } | null {
  const mouse = event as MouseEvent;
  if (typeof mouse.clientX === "number" && (mouse.clientX !== 0 || mouse.clientY !== 0)) {
    return { x: mouse.clientX, y: mouse.clientY };
  }
  const touch = (event as TouchEvent).changedTouches?.[0];
  return touch ? { x: touch.clientX, y: touch.clientY } : null;
}

/** Área (o ancestro del breadcrumb) bajo el puntero al soltar, si la hay. */
function dropTargetAt(x: number, y: number, draggedId: number): number | null | undefined {
  for (const element of document.elementsFromPoint(x, y)) {
    if (element.closest("[data-area-mini='true']")) continue;

    const crumb = element.closest("[data-drop-parent]") as HTMLElement | null;
    if (crumb) {
      const value = crumb.dataset.dropParent;
      return value === "root" ? null : Number(value);
    }

    const card = element.closest("[data-area-level='current']") as HTMLElement | null;
    if (card) {
      const id = Number(card.dataset.areaId);
      if (id !== draggedId) return id;
    }
  }
  return undefined;
}

interface AreaMapTabProps {
  areas: InventoryArea[];
  loading: boolean;
  error: string | null;
  currentParentId: number | null;
  onNavigate: (parentId: number | null) => void;
  onEdit: (area: InventoryArea) => void;
  onDelete: (id: number) => void;
  onAdd: (parentAreaId: number | null) => void;
  onSaveLayout: (items: LayoutItem[], parentId: number | null, reparented: Map<number, number | null>) => Promise<boolean>;
  onRetry: () => void;
}

export function AreaMapTab({
  areas,
  loading,
  error,
  currentParentId,
  onNavigate,
  onEdit,
  onDelete,
  onAdd,
  onSaveLayout,
  onRetry,
}: AreaMapTabProps) {
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));
  const { getCoverage } = useValidations();
  const { confirm, confirmDialog } = useConfirmDialog();

  const [coverage, setCoverage] = useState<AreaCoverage[] | null>(null);
  const [coverageFailed, setCoverageFailed] = useState(false);
  const [editable, setEditable] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sheetArea, setSheetArea] = useState<InventoryArea | null>(null);
  const [moveArea, setMoveArea] = useState<InventoryArea | null>(null);
  const [containerWidth, setContainerWidth] = useState(DESIGN_WIDTH);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Borrador: el layout del nivel actual más los cambios de padre pendientes.
  const [draft, setDraft] = useState<LayoutItem[] | null>(null);
  const [reparented, setReparented] = useState<Map<number, number | null>>(new Map());
  const draftRef = useRef<LayoutItem[] | null>(null);

  useEffect(() => {
    const load = async () => {
      const result = await getCoverage();
      setCoverage(result?.areas ?? []);
      setCoverageFailed(!result);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    observer.observe(element);
    setContainerWidth(element.clientWidth);
    return () => observer.disconnect();
  }, []);

  const savedLayout = useMemo(
    () => areasToLayout(areas, currentParentId),
    [areas, currentParentId]
  );

  // Al cambiar de nivel o al llegar datos nuevos del servidor se descarta el
  // borrador: no hay cambios sin guardar que preservar entre niveles.
  useEffect(() => {
    setDraft(null);
    draftRef.current = null;
    setReparented(new Map());
  }, [currentParentId, savedLayout]);

  const layout = draft ?? savedLayout;
  const dirty = draft !== null || reparented.size > 0;

  const coverageByArea = useMemo(
    () => new Map((coverage ?? []).map((item) => [item.area_id, item])),
    [coverage]
  );
  const path = useMemo(() => pathTo(areas, currentParentId), [areas, currentParentId]);
  const areasById = useMemo(() => new Map(areas.map((area) => [area.area_id, area])), [areas]);

  const applyLayout = useCallback((next: readonly LayoutItem[]) => {
    const copy = [...next];
    draftRef.current = copy;
    setDraft(copy);
  }, []);

  const handleLayoutChange = useCallback(
    (next: Layout) => {
      // Guarda contra el eco controlado ↔ RGL (bucle infinito en StrictMode).
      const current = draftRef.current ?? savedLayout;
      if (!sameLayout(current, next)) applyLayout(next);
    },
    [savedLayout, applyLayout]
  );

  const handleResizeStop = useCallback(
    (next: Layout) => applyLayout(next),
    [applyLayout]
  );

  const handleDragStop = useCallback(
    async (next: Layout, oldItem: LayoutItem | null, newItem: LayoutItem | null, event: Event) => {
      const pointer = newItem ? pointerPosition(event) : null;
      const target = pointer ? dropTargetAt(pointer.x, pointer.y, Number(newItem!.i)) : undefined;

      // undefined = se soltó en el lienzo vacío: es solo un cambio de posición.
      if (target === undefined) {
        if (newItem && hasCollision(next, newItem)) {
          applyLayout(draftRef.current ?? savedLayout);
          return;
        }
        applyLayout(next);
        return;
      }

      const dragged = areasById.get(Number(newItem!.i));
      if (!dragged) return;

      const revert = () => applyLayout(draftRef.current ?? savedLayout);

      if (target !== null && isDescendant(areas, target, dragged.area_id)) {
        revert();
        return;
      }
      if (pathTo(areas, target).length >= MAX_MAP_DEPTH) {
        revert();
        return;
      }

      const targetName = target === null ? "el nivel principal" : `«${areasById.get(target)?.name}»`;
      const confirmed = await confirm({
        title: "Mover área",
        message: `¿Mover «${dragged.name}» dentro de ${targetName}? Sus sub-áreas se mueven con ella.`,
        confirmLabel: "Mover",
        confirmColor: "primary",
      });
      if (!confirmed) {
        revert();
        return;
      }

      applyLayout(next.filter((item) => item.i !== newItem!.i));
      setReparented((prev) => new Map(prev).set(dragged.area_id, target));
    },
    [areas, areasById, savedLayout, applyLayout, confirm]
  );

  const handleSave = async () => {
    setSaving(true);
    const ok = await onSaveLayout(layout, currentParentId, reparented);
    setSaving(false);
    if (ok) {
      setDraft(null);
      draftRef.current = null;
      setReparented(new Map());
    }
  };

  const handleDiscard = () => {
    setDraft(null);
    draftRef.current = null;
    setReparented(new Map());
  };

  const handleNavigate = async (parentId: number | null) => {
    if (dirty) {
      const confirmed = await confirm({
        title: "Cambios sin guardar",
        message: "Tienes cambios sin guardar en este nivel. ¿Descartarlos?",
        confirmLabel: "Descartar",
      });
      if (!confirmed) return;
      handleDiscard();
    }
    onNavigate(parentId);
  };

  const handleMoveConfirm = (parentAreaId: number | null) => {
    if (!moveArea) return;
    applyLayout(layout.filter((item) => Number(item.i) !== moveArea.area_id));
    setReparented((prev) => new Map(prev).set(moveArea.area_id, parentAreaId));
    setMoveArea(null);
    setSheetArea(null);
    setEditable(true);
  };

  const renderItem = useCallback(
    (areaId: number) => {
      const area = areasById.get(areaId);
      if (!area) return null;
      return (
        <AreaMapCard
          area={area}
          areas={areas}
          coverage={coverageByArea.get(areaId)}
          coverageByArea={coverageByArea}
          childCount={childrenOf(areas, areaId).length}
          editable={editable}
          compact={isMobile}
          onOpen={() => handleNavigate(areaId)}
          onEdit={() => onEdit(area)}
          onDelete={() => onDelete(areaId)}
          onMove={() => setMoveArea(area)}
          onSelect={() => setSheetArea(area)}
        />
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [areas, areasById, coverageByArea, editable, isMobile, dirty]
  );

  // Aviso al cerrar la pestaña del navegador con cambios pendientes.
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Box component="button" onClick={onRetry} sx={{ all: "unset", cursor: "pointer", fontWeight: 600 }}>
            Reintentar
          </Box>
        }
      >
        {error}
      </Alert>
    );
  }

  // El mapa se dibuja siempre al ancho de diseño y se escala; así móvil y
  // escritorio muestran exactamente el mismo plano, sin recalcular el layout.
  const scale = Math.min(1, Math.max(0.45, containerWidth / DESIGN_WIDTH));
  const rows = levelBounds(layout).rows;
  const contentHeight = mapHeight(rows);

  return (
    <Box>
      <AreaMapBreadcrumb path={path} onNavigate={handleNavigate} />

      {!isMobile && (
        <AreaMapToolbar
          editable={editable}
          dirty={dirty}
          saving={saving}
          count={layout.length}
          onToggleEdit={async (next) => {
            if (!next && dirty) {
              const confirmed = await confirm({
                title: "Cambios sin guardar",
                message: "Saldrás del modo edición y se descartarán los cambios del mapa. ¿Continuar?",
                confirmLabel: "Descartar",
              });
              if (!confirmed) return;
              handleDiscard();
            }
            setEditable(next);
          }}
          onSave={handleSave}
          onDiscard={handleDiscard}
          onAdd={() => onAdd(currentParentId)}
        />
      )}

      {coverageFailed && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          No se pudo cargar el estado de validación; el mapa se muestra sin esa información.
        </Alert>
      )}

      {dirty && (
        <Alert severity="info" sx={{ mb: 1 }}>
          Tienes cambios sin guardar en el mapa.
        </Alert>
      )}

      {isMobile && (
        <Alert severity="info" sx={{ mb: 1 }}>
          El mapa es de solo lectura en el teléfono. Toca un área para ver sus acciones.
        </Alert>
      )}

      <Box ref={containerRef} sx={{ width: "100%", overflowX: "auto", overflowY: "hidden" }}>
        {loading ? (
          <MapSkeleton />
        ) : layout.length === 0 ? (
          <Box sx={{ py: 4 }}>
            <GridEmptyState
              message={
                currentParentId === null
                  ? "No hay áreas creadas todavía."
                  : "Esta área no tiene sub-áreas."
              }
              actionLabel="Agregar área aquí"
              onAction={() => onAdd(currentParentId)}
            />
          </Box>
        ) : (
          <Box
            sx={{
              width: DESIGN_WIDTH,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              // Recupera el alto sobrante que deja la escala (transform no
              // afecta al flujo del documento).
              mb: `${-(contentHeight * (1 - scale))}px`,
            }}
          >
            <AreaMapGrid
              layout={layout}
              width={DESIGN_WIDTH}
              editable={editable && !isMobile}
              renderItem={renderItem}
              onLayoutChange={handleLayoutChange}
              onDragStop={handleDragStop}
              onResizeStop={handleResizeStop}
            />
          </Box>
        )}
      </Box>

      {confirmDialog}

      <AreaSheet
        area={sheetArea}
        pathLabel={
          sheetArea
            ? pathTo(areas, sheetArea.area_id)
                .slice(0, -1)
                .map((a) => a.name)
                .join(" › ")
            : ""
        }
        coverage={sheetArea ? coverageByArea.get(sheetArea.area_id) : undefined}
        childCount={sheetArea ? childrenOf(areas, sheetArea.area_id).length : 0}
        onClose={() => setSheetArea(null)}
        onOpen={() => {
          if (sheetArea) handleNavigate(sheetArea.area_id);
          setSheetArea(null);
        }}
        onEdit={() => {
          if (sheetArea) onEdit(sheetArea);
          setSheetArea(null);
        }}
        onDelete={() => {
          if (sheetArea) onDelete(sheetArea.area_id);
          setSheetArea(null);
        }}
        onMove={() => setMoveArea(sheetArea)}
      />

      <MoveAreaDialog
        area={moveArea}
        areas={areas}
        onClose={() => setMoveArea(null)}
        onConfirm={handleMoveConfirm}
      />
    </Box>
  );
}
