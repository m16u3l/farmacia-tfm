export const AREA_TYPES = ['sucursal', 'almacen', 'estante', 'otro'] as const;
export type AreaType = typeof AREA_TYPES[number];

export interface InventoryArea {
  area_id: number;
  name: string;
  type: AreaType;
  parent_area_id?: number | null;
  is_active: boolean;
  parent_name?: string; // For joined queries
}

export type InventoryAreaFormData = Omit<InventoryArea, 'area_id' | 'parent_name'>;
