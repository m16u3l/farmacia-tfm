import { AreaLayoutItem, AreaType, InventoryArea } from '@/types/area';

/** Columnas de la cuadrícula del mapa. Debe coincidir con el CHECK de la BD. */
export const MAP_COLS = 12;
/** Alto de una fila de la cuadrícula, en píxeles. */
export const ROW_HEIGHT = 40;
/** Separación [x, y] entre tarjetas, en píxeles. */
export const MAP_MARGIN: [number, number] = [8, 8];
/**
 * Ancho de referencia con el que siempre se dibuja el mapa. En pantallas más
 * angostas el contenedor lo escala con transform, conservando proporciones.
 */
export const DESIGN_WIDTH = 900;
/** Niveles de anidamiento permitidos (mismo valor que MAX_MAP_DEPTH del servidor). */
export const MAX_MAP_DEPTH = 4;

export const DEFAULT_MAP_SIZE: Record<AreaType, { w: number; h: number }> = {
  sucursal: { w: 6, h: 5 },
  almacen: { w: 6, h: 5 },
  estante: { w: 3, h: 4 },
  apartado: { w: 2, h: 2 },
  otro: { w: 3, h: 3 },
};

/** Item de layout de react-grid-layout, con solo los campos que usamos. */
export interface MapLayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Hijos directos de un nivel, ordenados como se dibujan (arriba-abajo, izq-der). */
export function childrenOf(areas: InventoryArea[], parentId: number | null): InventoryArea[] {
  return areas
    .filter((a) => (a.parent_area_id ?? null) === parentId)
    .sort((a, b) => a.map_y - b.map_y || a.map_x - b.map_x || a.name.localeCompare(b.name));
}

/** Convierte los hijos de un nivel en el layout que consume react-grid-layout. */
export function areasToLayout(areas: InventoryArea[], parentId: number | null): MapLayoutItem[] {
  return childrenOf(areas, parentId).map((area) => ({
    i: String(area.area_id),
    x: area.map_x,
    y: area.map_y,
    w: area.map_w,
    h: area.map_h,
  }));
}

/** Convierte el layout de vuelta al cuerpo que espera el endpoint de guardado. */
export function layoutToItems(layout: readonly MapLayoutItem[], parentId: number | null): AreaLayoutItem[] {
  return layout.map((item) => ({
    area_id: Number(item.i),
    x: item.x,
    y: item.y,
    w: item.w,
    h: item.h,
    parent_area_id: parentId,
  }));
}

/**
 * ¿`item` se superpone con alguno de `others`? Dos tarjetas que solo comparten
 * un borde (una termina donde empieza la otra) no colisionan.
 */
export function hasCollision(others: readonly MapLayoutItem[], item: MapLayoutItem): boolean {
  return others.some(
    (other) =>
      other.i !== item.i &&
      item.x < other.x + other.w &&
      other.x < item.x + item.w &&
      item.y < other.y + other.h &&
      other.y < item.y + item.h
  );
}

/** Compara dos layouts por contenido. Evita el bucle controlado ↔ onLayoutChange. */
export function sameLayout(a: readonly MapLayoutItem[], b: readonly MapLayoutItem[]): boolean {
  if (a.length !== b.length) return false;
  const byId = new Map(b.map((item) => [item.i, item]));
  return a.every((item) => {
    const other = byId.get(item.i);
    return !!other && other.x === item.x && other.y === item.y && other.w === item.w && other.h === item.h;
  });
}

/** Posición libre para un área que entra en un nivel: fila propia bajo el resto. */
export function nextFreeSlotClient(
  siblings: readonly MapLayoutItem[],
  type: AreaType
): { x: number; y: number; w: number; h: number } {
  const size = DEFAULT_MAP_SIZE[type] ?? DEFAULT_MAP_SIZE.otro;
  const nextY = siblings.reduce((max, item) => Math.max(max, item.y + item.h), 0);
  return { x: 0, y: nextY, w: size.w, h: size.h };
}

/** Dimensiones ocupadas por un nivel, para escalar las miniaturas a porcentajes. */
export function levelBounds(items: readonly MapLayoutItem[]): { cols: number; rows: number } {
  const rows = items.reduce((max, item) => Math.max(max, item.y + item.h), 0);
  return { cols: MAP_COLS, rows: rows || 1 };
}

/** ¿`candidateId` está dentro del subárbol de `ancestorId`? */
export function isDescendant(areas: InventoryArea[], candidateId: number, ancestorId: number): boolean {
  const parents = new Map(areas.map((a) => [a.area_id, a.parent_area_id ?? null]));
  let current = parents.get(candidateId) ?? null;
  const seen = new Set<number>();

  while (current !== null && !seen.has(current)) {
    if (current === ancestorId) return true;
    seen.add(current);
    current = parents.get(current) ?? null;
  }
  return false;
}

/** Ruta desde la raíz hasta `areaId`, incluida. Vacía si `areaId` es null. */
export function pathTo(areas: InventoryArea[], areaId: number | null): InventoryArea[] {
  const byId = new Map(areas.map((a) => [a.area_id, a]));
  const path: InventoryArea[] = [];
  const seen = new Set<number>();
  let current = areaId;

  while (current !== null && !seen.has(current)) {
    const area = byId.get(current);
    if (!area) break;
    path.unshift(area);
    seen.add(current);
    current = area.parent_area_id ?? null;
  }
  return path;
}

/**
 * Lotes con existencias de un área y de todas sus sub-áreas. La cobertura solo
 * informa el stock directo, así que un almacén cuyo contenido está en sus
 * estantes se vería como "Sin stock" si se usara ese número tal cual.
 */
export function subtreeLots(
  areas: InventoryArea[],
  lotsByArea: Map<number, number>,
  areaId: number
): number {
  const byParent = new Map<number, number[]>();
  for (const area of areas) {
    const parentId = area.parent_area_id ?? null;
    if (parentId === null) continue;
    if (!byParent.has(parentId)) byParent.set(parentId, []);
    byParent.get(parentId)!.push(area.area_id);
  }

  let total = 0;
  const pending = [areaId];
  const seen = new Set<number>();

  while (pending.length > 0) {
    const current = pending.pop()!;
    if (seen.has(current)) continue;
    seen.add(current);
    total += lotsByArea.get(current) ?? 0;
    pending.push(...(byParent.get(current) ?? []));
  }
  return total;
}

/** Profundidad (1 = raíz) que tendría un área colgada de `parentId`. */
export function depthOf(areas: InventoryArea[], parentId: number | null): number {
  return pathTo(areas, parentId).length + 1;
}

/** Alto en píxeles que ocupa un nivel con `rows` filas. */
export function mapHeight(rows: number): number {
  return rows * ROW_HEIGHT + (rows + 1) * MAP_MARGIN[1];
}
