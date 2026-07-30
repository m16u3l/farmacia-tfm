import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/config/db";
import { getSessionFromRequest } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { assertNoCycle, nextFreeSlot } from "@/lib/inventoryAreas";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT
          a.*,
          p.name as parent_name
        FROM inventory_areas a
        LEFT JOIN inventory_areas p ON a.parent_area_id = p.area_id
        WHERE a.area_id = $1`,
        [params.id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Área de inventario no encontrada" },
          { status: 404 }
        );
      }

      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching inventory area:", error);
    return NextResponse.json(
      { error: "Error al obtener el área de inventario" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const areaId = Number(params.id);
  try {
    const data = await request.json();
    const { name, type, parent_area_id, is_active } = data;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "El nombre del área es obligatorio" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      if (parent_area_id) {
        const cycleError = await assertNoCycle(client, areaId, parent_area_id);
        if (cycleError) {
          return NextResponse.json({ error: cycleError }, { status: 400 });
        }
      }

      // Al cambiar de nivel, las coordenadas del mapa (relativas al padre) ya
      // no significan nada en el destino: se recoloca en una fila libre.
      const current = await client.query<{ parent_area_id: number | null }>(
        "SELECT parent_area_id FROM inventory_areas WHERE area_id = $1",
        [areaId]
      );
      const nextParentId = parent_area_id || null;
      const changedParent =
        current.rows.length > 0 && current.rows[0].parent_area_id !== nextParentId;
      const slot = changedParent
        ? await nextFreeSlot(client, nextParentId, type || "otro")
        : null;

      const result = await client.query(
        `UPDATE inventory_areas
         SET name = $1, type = $2, parent_area_id = $3, is_active = $4,
             map_x = COALESCE($6, map_x), map_y = COALESCE($7, map_y),
             map_w = COALESCE($8, map_w), map_h = COALESCE($9, map_h)
         WHERE area_id = $5
         RETURNING *`,
        [
          name.trim(),
          type || "otro",
          nextParentId,
          is_active ?? true,
          areaId,
          slot?.map_x ?? null,
          slot?.map_y ?? null,
          slot?.map_w ?? null,
          slot?.map_h ?? null,
        ]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Área de inventario no encontrada" },
          { status: 404 }
        );
      }

      const session = await getSessionFromRequest(request);
      await logAudit(session?.userId ?? null, "update", "inventory_area", areaId, { name, type, parent_area_id });

      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error updating inventory area:", error);
    return NextResponse.json(
      { error: "Error al actualizar el área de inventario" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const areaId = Number(params.id);
  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Solo el stock real impide borrar. Los lotes agotados (cantidad 0) no
      // se ven en ninguna parte de la UI —la cobertura solo cuenta los que
      // tienen existencias—, así que bloquear por ellos daba un error
      // imposible de accionar: el área figuraba "Sin stock" y aun así no se
      // dejaba eliminar.
      const stock = await client.query<{ lotes: number; unidades: number; vacios: number }>(
        `SELECT
           count(*) FILTER (WHERE quantity_available > 0)::int AS lotes,
           COALESCE(sum(quantity_available), 0)::int AS unidades,
           count(*) FILTER (WHERE quantity_available = 0)::int AS vacios
         FROM inventory WHERE area_id = $1`,
        [areaId]
      );
      const { lotes, unidades, vacios } = stock.rows[0];

      if (lotes > 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          {
            error:
              `No se puede eliminar: el área todavía tiene ${lotes} lote${lotes === 1 ? "" : "s"} ` +
              `con ${unidades} unidad${unidades === 1 ? "" : "es"}. ` +
              `Transfiérelos a otra área desde Inventario antes de eliminarla.`,
          },
          { status: 409 }
        );
      }

      // Los lotes agotados sí hay que reubicarlos: la FK es ON DELETE SET NULL
      // y un lote sin área queda invisible para las validaciones (por eso la
      // migración 021 creó "Por clasificar").
      if (vacios > 0) {
        const fallback = await client.query<{ area_id: number }>(
          `SELECT area_id FROM inventory_areas
           WHERE name = 'Por clasificar' AND parent_area_id IS NULL
           LIMIT 1`
        );
        const fallbackId = fallback.rows[0]?.area_id;

        if (!fallbackId || fallbackId === areaId) {
          await client.query("ROLLBACK");
          return NextResponse.json(
            {
              error:
                `No se puede eliminar: el área tiene ${vacios} lote${vacios === 1 ? "" : "s"} agotado${vacios === 1 ? "" : "s"} ` +
                `y no hay un área "Por clasificar" a donde reubicarlos.`,
            },
            { status: 409 }
          );
        }

        await client.query("UPDATE inventory SET area_id = $1 WHERE area_id = $2", [
          fallbackId,
          areaId,
        ]);
      }

      let result;
      try {
        result = await client.query(
          "DELETE FROM inventory_areas WHERE area_id = $1 RETURNING *",
          [areaId]
        );
      } catch (dbError: unknown) {
        await client.query("ROLLBACK");
        if ((dbError as { code?: string }).code === "23503") {
          return NextResponse.json(
            { error: "No se puede eliminar: el área todavía tiene sub-áreas" },
            { status: 409 }
          );
        }
        throw dbError;
      }

      if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "Área de inventario no encontrada" },
          { status: 404 }
        );
      }

      await client.query("COMMIT");

      const session = await getSessionFromRequest(request);
      await logAudit(session?.userId ?? null, "delete", "inventory_area", areaId, {
        name: result.rows[0].name,
        lotes_agotados_reubicados: vacios,
      });

      return NextResponse.json({
        message:
          vacios > 0
            ? `Área eliminada. ${vacios} lote${vacios === 1 ? "" : "s"} agotado${vacios === 1 ? "" : "s"} se movió a "Por clasificar".`
            : "Área de inventario eliminada correctamente",
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error deleting inventory area:", error);
    return NextResponse.json(
      { error: "Error al eliminar el área de inventario" },
      { status: 500 }
    );
  }
}
