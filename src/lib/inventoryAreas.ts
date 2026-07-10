import { PoolClient } from "pg";

const MAX_DEPTH = 50;

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
