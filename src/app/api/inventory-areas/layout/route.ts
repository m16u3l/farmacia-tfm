import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/config/db";
import { getSessionFromRequest } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { assertNoCycleBatch, MAP_COLS, MAX_MAP_DEPTH } from "@/lib/inventoryAreas";

const MAX_ITEMS = 500;
const MAX_ROWS = 200;
const MAX_ITEM_HEIGHT = 48;

interface ParsedItem {
  area_id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  parent_area_id: number | null;
}

function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isNonNegativeInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

/** Valida la forma del cuerpo. Devuelve los items o un mensaje de error. */
function parseItems(body: unknown): { items: ParsedItem[] } | { error: string } {
  const rawItems = (body as { items?: unknown })?.items;
  if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > MAX_ITEMS) {
    return { error: "El mapa enviado no es válido" };
  }

  const items: ParsedItem[] = [];
  const seen = new Set<number>();

  for (const raw of rawItems) {
    const item = raw as Record<string, unknown>;
    if (!isPositiveInt(item.area_id)) {
      return { error: "El mapa enviado no es válido" };
    }
    if (seen.has(item.area_id)) {
      return { error: "Hay áreas repetidas en el mapa" };
    }
    seen.add(item.area_id);

    if (
      !isNonNegativeInt(item.x) ||
      !isNonNegativeInt(item.y) ||
      !isPositiveInt(item.w) ||
      !isPositiveInt(item.h) ||
      item.x + item.w > MAP_COLS ||
      item.h > MAX_ITEM_HEIGHT ||
      item.y + item.h > MAX_ROWS
    ) {
      return { error: "Posición o tamaño fuera de los límites del mapa" };
    }

    const parentAreaId = item.parent_area_id ?? null;
    if (parentAreaId !== null && !isPositiveInt(parentAreaId)) {
      return { error: "El área padre indicada no existe" };
    }

    items.push({
      area_id: item.area_id,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      parent_area_id: parentAreaId as number | null,
    });
  }

  return { items };
}

/**
 * Guarda en lote la geometría del mapa (y los cambios de área padre que haya
 * hecho el usuario arrastrando). Va en una sola transacción: mover varias
 * tarjetas y soltarlas en otro contenedor es una única acción para el usuario,
 * y validar ciclos requiere mirar el árbol resultante completo, no área por
 * área como hace PUT /api/inventory-areas/[id].
 */
export async function PUT(request: NextRequest) {
  try {
    const parsed = parseItems(await request.json());
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { items } = parsed;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Bloquea el árbol para que un POST/PUT concurrente no invalide la
      // validación de ciclos entre que la calculamos y la escribimos.
      const tree = await client.query<{
        area_id: number;
        parent_area_id: number | null;
        map_x: number;
        map_y: number;
        map_w: number;
        map_h: number;
      }>(
        `SELECT area_id, parent_area_id, map_x, map_y, map_w, map_h
         FROM inventory_areas
         FOR UPDATE`
      );

      const existing = new Map(tree.rows.map((row) => [row.area_id, row]));

      for (const item of items) {
        if (!existing.has(item.area_id)) {
          await client.query("ROLLBACK");
          return NextResponse.json(
            { error: "Una de las áreas del mapa ya no existe" },
            { status: 404 }
          );
        }
        if (item.parent_area_id !== null && !existing.has(item.parent_area_id)) {
          await client.query("ROLLBACK");
          return NextResponse.json(
            { error: "El área padre indicada no existe" },
            { status: 400 }
          );
        }
      }

      const cycleError = assertNoCycleBatch(
        new Map(tree.rows.map((row) => [row.area_id, row.parent_area_id])),
        new Map(items.map((item) => [item.area_id, item.parent_area_id])),
        MAX_MAP_DEPTH
      );
      if (cycleError) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: cycleError }, { status: 400 });
      }

      const result = await client.query<{ area_id: number }>(
        `UPDATE inventory_areas a
         SET map_x = v.x, map_y = v.y, map_w = v.w, map_h = v.h,
             parent_area_id = v.parent_area_id
         FROM (
           SELECT * FROM unnest(
             $1::int[], $2::int[], $3::int[], $4::int[], $5::int[], $6::int[]
           ) AS t(area_id, x, y, w, h, parent_area_id)
         ) v
         WHERE a.area_id = v.area_id
           AND (a.map_x, a.map_y, a.map_w, a.map_h, a.parent_area_id)
               IS DISTINCT FROM (v.x, v.y, v.w, v.h, v.parent_area_id)
         RETURNING a.area_id`,
        [
          items.map((i) => i.area_id),
          items.map((i) => i.x),
          items.map((i) => i.y),
          items.map((i) => i.w),
          items.map((i) => i.h),
          items.map((i) => i.parent_area_id),
        ]
      );

      const areas = await client.query(
        `SELECT a.*, p.name as parent_name
         FROM inventory_areas a
         LEFT JOIN inventory_areas p ON a.parent_area_id = p.area_id
         ORDER BY a.parent_area_id NULLS FIRST, a.map_y, a.map_x, a.name`
      );

      await client.query("COMMIT");

      // Solo se audita el cambio de jerarquía: mover una tarjeta unos píxeles
      // no es un hecho que valga la pena guardar fila a fila en audit_log.
      const session = await getSessionFromRequest(request);
      const reparented = items.filter((item) => {
        const previous = existing.get(item.area_id);
        return previous && previous.parent_area_id !== item.parent_area_id;
      });

      for (const item of reparented) {
        await logAudit(session?.userId ?? null, "update", "inventory_area", item.area_id, {
          action: "reparent",
          from: existing.get(item.area_id)?.parent_area_id ?? null,
          to: item.parent_area_id,
        });
      }

      return NextResponse.json({ updated: result.rowCount ?? 0, areas: areas.rows });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error saving inventory area layout:", error);
    return NextResponse.json(
      { error: "Error al guardar el mapa de áreas" },
      { status: 500 }
    );
  }
}
