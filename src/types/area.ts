export const AREA_TYPES = ['sucursal', 'almacen', 'estante', 'apartado', 'otro'] as const;
export type AreaType = typeof AREA_TYPES[number];

export interface InventoryArea {
  area_id: number;
  name: string;
  type: AreaType;
  parent_area_id?: number | null;
  is_active: boolean;
  parent_name?: string; // For joined queries
  // Posición y tamaño en el mapa de almacén, relativos al área padre.
  map_x: number;
  map_y: number;
  map_w: number;
  map_h: number;
}

// El formulario de área no edita la geometría del mapa (eso se hace
// arrastrando en la pestaña Mapa), así que map_* queda fuera.
export type InventoryAreaFormData = Omit<
  InventoryArea,
  'area_id' | 'parent_name' | 'map_x' | 'map_y' | 'map_w' | 'map_h'
>;

/** Una fila del cuerpo de PUT /api/inventory-areas/layout. */
export interface AreaLayoutItem {
  area_id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  parent_area_id: number | null;
}

export interface AreaLayoutSaveResult {
  updated: number;
  areas: InventoryArea[];
}
