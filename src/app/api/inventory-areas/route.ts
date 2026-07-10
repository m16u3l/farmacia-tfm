import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/config/db";
import { getSessionFromRequest } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { assertNoCycle } from "@/lib/inventoryAreas";

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT
          a.*,
          p.name as parent_name
        FROM inventory_areas a
        LEFT JOIN inventory_areas p ON a.parent_area_id = p.area_id
        ORDER BY a.name
      `);
      return NextResponse.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching inventory areas:", error);
    return NextResponse.json(
      { error: "Error al obtener las áreas de inventario" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
        const cycleError = await assertNoCycle(client, null, parent_area_id);
        if (cycleError) {
          return NextResponse.json({ error: cycleError }, { status: 400 });
        }
      }

      const session = await getSessionFromRequest(request);
      const result = await client.query(
        `INSERT INTO inventory_areas (name, type, parent_area_id, is_active, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [name.trim(), type || "otro", parent_area_id || null, is_active ?? true, session?.userId ?? null]
      );

      await logAudit(session?.userId ?? null, "create", "inventory_area", result.rows[0].area_id, { name, type, parent_area_id });

      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating inventory area:", error);
    return NextResponse.json(
      { error: "Error al crear el área de inventario" },
      { status: 500 }
    );
  }
}
