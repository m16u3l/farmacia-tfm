"use client";

import { ReactNode } from "react";
import GridLayout, { getCompactor, type Layout, type LayoutItem } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import { Box } from "@mui/material";
import { MAP_COLS, MAP_MARGIN, ROW_HEIGHT } from "@/utils/areaMap";

// Sin compactación y sin empujar tarjetas: cada área se queda donde la sueltan
// y, si el destino está ocupado, simplemente no se coloca ahí. Empujar a los
// vecinos rompería el reparentado por drop (la tarjeta destino se apartaría
// justo antes de soltar).
const MAP_COMPACTOR = getCompactor(null, false, true);

export interface AreaMapGridProps {
  layout: LayoutItem[];
  width: number;
  editable: boolean;
  renderItem: (areaId: number) => ReactNode;
  onLayoutChange: (layout: Layout) => void;
  onDragStop: (layout: Layout, oldItem: LayoutItem | null, newItem: LayoutItem | null, event: Event) => void;
  onResizeStop: (layout: Layout) => void;
}

/**
 * Único punto del proyecto que toca react-grid-layout. Se monta con
 * `dynamic(..., { ssr: false })` porque la librería mide el DOM al iniciar.
 */
export default function AreaMapGrid({
  layout,
  width,
  editable,
  renderItem,
  onLayoutChange,
  onDragStop,
  onResizeStop,
}: AreaMapGridProps) {
  return (
    <Box
      sx={{
        // El placeholder de RGL viene en rojo por defecto.
        "& .react-grid-item.react-grid-placeholder": {
          bgcolor: "primary.main",
          opacity: 0.18,
          borderRadius: 2,
        },
        // El CSS de RGL deja los handles con opacity 0; en modo edición sí
        // queremos verlos.
        "& .react-grid-item > .react-resizable-handle": { opacity: 0.7 },
      }}
    >
      <GridLayout
        width={width}
        layout={layout}
        compactor={MAP_COMPACTOR}
        autoSize
        gridConfig={{
          cols: MAP_COLS,
          rowHeight: ROW_HEIGHT,
          margin: MAP_MARGIN,
          containerPadding: [0, 0],
          maxRows: 200,
        }}
        dragConfig={{
          // Sin `bounded`: el contenedor se autoajusta al contenido, así que
          // acotarlo impediría llevar una tarjeta a una fila nueva por debajo
          // del mapa actual. Los límites reales los ponen cols y maxRows.
          enabled: editable,
          bounded: false,
          threshold: 5,
          // Sin handle, arrastrar la tarjeta en una pantalla táctil impediría
          // el scroll de la página; sin cancel, los botones de acción de la
          // tarjeta iniciarían un arrastre.
          handle: ".area-card-handle",
          cancel: ".area-card-actions",
        }}
        // `handles: []` fuera del modo edición: con enabled:false RGL igual
        // deja los tiradores en el DOM, y en móvil no deben existir.
        resizeConfig={{ enabled: editable, handles: editable ? ["se"] : [] }}
        onLayoutChange={onLayoutChange}
        onDragStop={(next, oldItem, newItem, _placeholder, event) =>
          onDragStop(next, oldItem, newItem, event)
        }
        onResizeStop={(next) => onResizeStop(next)}
      >
        {layout.map((item) => (
          <div key={item.i}>{renderItem(Number(item.i))}</div>
        ))}
      </GridLayout>
    </Box>
  );
}
