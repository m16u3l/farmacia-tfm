import { PoolClient } from "pg";
import { AreaType } from "@/types/area";

const MAX_DEPTH = 50;

/** Ancho de la cuadrícula del mapa de almacén, en columnas. */
export const MAP_COLS = 12;

/** Niveles de anidamiento permitidos (sucursal › almacén › estante › apartado). */
export const MAX_MAP_DEPTH = 4;

/** Tamaño inicial de la tarjeta según el tipo de área, en celdas. */
export const DEFAULT_MAP_SIZE: Record<AreaType, { w: number; h: number }> = {
  sucursal: { w: 6, h: 5 },
  almacen: { w: 6, h: 5 },
  estante: { w: 3, h: 4 },
  apartado: { w: 2, h: 2 },
  otro: { w: 3, h: 3 },
};

/**
 * Valida que asignar `parentAreaId` como padre de `id` no genere un ciclo
 * (un área no puede ser su propio ancestro). Postgres no puede verificar esto
 * con una FK/CHECK simple, así que se recorre el árbol hacia arriba en la API.
 * Devuelve un mensaje de error si hay ciclo, o null si es válido.
 */
export async function assertNoCycle(
  client: PoolClient,
  id: number | null,
  parentAreaId: number
): Promise<string | null> {
  if (id !== null && parentAreaId === id) {
    return "Un área no puede ser su propia área padre";
  }

  let currentId: number | null = parentAreaId;
  let depth = 0;

  while (currentId !== null && depth < MAX_DEPTH) {
    if (id !== null && currentId === id) {
      return "No se puede asignar como padre a una de sus propias sub-áreas";
    }
    const result: { rows: { parent_area_id: number | null }[] } = await client.query(
      "SELECT parent_area_id FROM inventory_areas WHERE area_id = $1",
      [currentId]
    );
    if (result.rows.length === 0) break;
    currentId = result.rows[0].parent_area_id;
    depth++;
  }

  return null;
}

/**
 * Devuelve una posición libre para un área nueva dentro de su nivel: una fila
 * propia por debajo de todos sus hermanos, así nunca nace encima de otra.
 */
export async function nextFreeSlot(
  client: PoolClient,
  parentAreaId: number | null,
  type: AreaType
): Promise<{ map_x: number; map_y: number; map_w: number; map_h: number }> {
  const size = DEFAULT_MAP_SIZE[type] ?? DEFAULT_MAP_SIZE.otro;
  const result = await client.query(
    `SELECT COALESCE(MAX(map_y + map_h), 0)::int AS next_y
     FROM inventory_areas
     WHERE parent_area_id IS NOT DISTINCT FROM $1`,
    [parentAreaId]
  );

  return {
    map_x: 0,
    map_y: result.rows[0].next_y,
    map_w: size.w,
    map_h: size.h,
  };
}

/**
 * Valida ciclos y profundidad sobre el árbol RESULTANTE de aplicar un lote de
 * cambios de padre. `assertNoCycle` recorre la BD hacia arriba y por tanto no
 * ve un ciclo formado por dos reparentados del mismo lote (A→B y B→A).
 * Es puro: recibe el árbol ya leído, así que se testea sin base de datos.
 */
export function assertNoCycleBatch(
  currentParents: Map<number, number | null>,
  changes: Map<number, number | null>,
  maxDepth = MAX_MAP_DEPTH
): string | null {
  const parents = new Map(currentParents);
  for (const [areaId, parentId] of changes) {
    parents.set(areaId, parentId);
  }

  for (const areaId of parents.keys()) {
    if (parents.get(areaId) === areaId) {
      return "Un área no puede ser su propia área padre";
    }

    const seen = new Set<number>([areaId]);
    let current = parents.get(areaId) ?? null;
    let depth = 1;

    while (current !== null) {
      // Volver a pisar un área ya visitada solo puede significar que el árbol
      // se cierra sobre sí mismo a través de un descendiente.
      if (seen.has(current)) {
        return "No se puede asignar como padre a una de sus propias sub-áreas";
      }
      seen.add(current);
      depth++;
      if (depth > maxDepth) {
        return `No se pueden anidar más de ${maxDepth} niveles de áreas`;
      }
      current = parents.get(current) ?? null;
    }
  }

  return null;
}
