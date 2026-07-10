import { InventoryArea } from '@/types';

export interface AreaTreeOption {
  area: InventoryArea;
  depth: number;
  label: string;
}

/**
 * Ordena las áreas para que cada hijo aparezca justo después de su padre,
 * calculando la profundidad y una etiqueta tipo breadcrumb ("Padre › Hijo").
 * Usado por los selectores de área (InventoryForm, TransferDialog, AreaForm).
 */
export function buildAreaOptions(areas: InventoryArea[], excludeId?: number): AreaTreeOption[] {
  const byParent = new Map<number | null, InventoryArea[]>();
  for (const area of areas) {
    const parentKey = area.parent_area_id ?? null;
    if (!byParent.has(parentKey)) byParent.set(parentKey, []);
    byParent.get(parentKey)!.push(area);
  }
  for (const siblings of byParent.values()) {
    siblings.sort((a, b) => a.name.localeCompare(b.name));
  }

  const options: AreaTreeOption[] = [];

  const walk = (parentId: number | null, depth: number, ancestorLabel: string) => {
    const children = byParent.get(parentId) || [];
    for (const area of children) {
      if (area.area_id === excludeId) continue;
      const label = ancestorLabel ? `${ancestorLabel} › ${area.name}` : area.name;
      options.push({ area, depth, label });
      walk(area.area_id, depth + 1, label);
    }
  };

  walk(null, 0, '');
  return options;
}
