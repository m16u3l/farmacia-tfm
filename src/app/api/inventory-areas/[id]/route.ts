import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/config/db";
import { getSessionFromRequest } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { assertNoCycle } from "@/lib/inventoryAreas";

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

      const result = await client.query(
        `UPDATE inventory_areas
         SET name = $1, type = $2, parent_area_id = $3, is_active = $4
         WHERE area_id = $5
         RETURNING *`,
        [name.trim(), type || "otro", parent_area_id || null, is_active ?? true, areaId]
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
      const inventoryCount = await client.query(
        "SELECT count(*) FROM inventory WHERE area_id = $1",
        [areaId]
      );
      if (Number(inventoryCount.rows[0].count) > 0) {
        return NextResponse.json(
          { error: "No se puede eliminar: el área todavía tiene inventario asignado" },
          { status: 409 }
        );
      }

      let result;
      try {
        result = await client.query(
          "DELETE FROM inventory_areas WHERE area_id = $1 RETURNING *",
          [areaId]
        );
      } catch (dbError: unknown) {
        if ((dbError as { code?: string }).code === "23503") {
          return NextResponse.json(
            { error: "No se puede eliminar: el área todavía tiene sub-áreas" },
            { status: 409 }
          );
        }
        throw dbError;
      }

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Área de inventario no encontrada" },
          { status: 404 }
        );
      }

      const session = await getSessionFromRequest(request);
      await logAudit(session?.userId ?? null, "delete", "inventory_area", areaId);

      return NextResponse.json({ message: "Área de inventario eliminada correctamente" });
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
