import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/config/db";
import { getSessionFromRequest } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const ITEM_FILTERS: Record<string, string> = {
  area: "i.area_id = $2",
  expiring: "i.expiry_date IS NOT NULL AND i.expiry_date >= CURRENT_DATE AND i.expiry_date <= CURRENT_DATE + INTERVAL '40 days'",
  expired: "i.expiry_date IS NOT NULL AND i.expiry_date < CURRENT_DATE",
  low_stock: "i.quantity_available <= 10",
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT
          v.*,
          a.name as area_name
        FROM inventory_validations v
        LEFT JOIN inventory_areas a ON v.area_id = a.area_id
        ${status ? "WHERE v.status = $1" : ""}
        ORDER BY v.started_at DESC`,
        status ? [status] : []
      );
      return NextResponse.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching inventory validations:", error);
    return NextResponse.json(
      { error: "Error al obtener las validaciones de inventario" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { type, area_id, notes } = data;

    if (!type || !(type in ITEM_FILTERS)) {
      return NextResponse.json(
        { error: "Tipo de validación inválido" },
        { status: 400 }
      );
    }
    if (type === "area" && !area_id) {
      return NextResponse.json(
        { error: "El área es obligatoria para una validación por área" },
        { status: 400 }
      );
    }

    const session = await getSessionFromRequest(request);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const validationResult = await client.query(
        `INSERT INTO inventory_validations (type, area_id, notes, started_by)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [type, type === "area" ? area_id : null, notes || null, session?.userId ?? null]
      );
      const validation = validationResult.rows[0];

      const filterClause = ITEM_FILTERS[type];
      const filterParams = type === "area" ? [validation.validation_id, area_id] : [validation.validation_id];

      await client.query(
        `INSERT INTO inventory_validation_items (validation_id, inventory_id, expected_quantity)
         SELECT $1, i.inventory_id, i.quantity_available
         FROM inventory i
         WHERE ${filterClause}`,
        filterParams
      );

      await client.query("COMMIT");

      await logAudit(session?.userId ?? null, "create", "inventory_validation", validation.validation_id, { type, area_id });

      const itemsResult = await client.query(
        `SELECT
          vi.*,
          p.name as product_name,
          i.batch_number,
          i.expiry_date
        FROM inventory_validation_items vi
        LEFT JOIN inventory i ON vi.inventory_id = i.inventory_id
        LEFT JOIN products p ON i.product_id = p.product_id
        WHERE vi.validation_id = $1
        ORDER BY vi.validation_item_id`,
        [validation.validation_id]
      );

      return NextResponse.json({ ...validation, items: itemsResult.rows });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating inventory validation:", error);
    return NextResponse.json(
      { error: "Error al crear la validación de inventario" },
      { status: 500 }
    );
  }
}
