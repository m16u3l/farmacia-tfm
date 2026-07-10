import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/config/db";
import { getSessionFromRequest } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  const params = await context.params;
  try {
    const data = await request.json();
    const { actual_quantity, notes } = data;

    if (actual_quantity === undefined || actual_quantity === null || actual_quantity < 0) {
      return NextResponse.json(
        { error: "La cantidad real es obligatoria" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      const itemResult = await client.query(
        `SELECT * FROM inventory_validation_items WHERE validation_item_id = $1 AND validation_id = $2`,
        [params.itemId, params.id]
      );
      if (itemResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Ítem de validación no encontrado" },
          { status: 404 }
        );
      }
      const item = itemResult.rows[0];

      let status: "confirmed" | "inconsistent" | "not_found";
      if (actual_quantity === 0) {
        status = "not_found";
      } else if (actual_quantity !== item.expected_quantity) {
        status = "inconsistent";
      } else {
        status = "confirmed";
      }

      const session = await getSessionFromRequest(request);
      const result = await client.query(
        `UPDATE inventory_validation_items
         SET actual_quantity = $1, status = $2, notes = $3, verified_by = $4, verified_at = NOW()
         WHERE validation_item_id = $5
         RETURNING *`,
        [actual_quantity, status, notes || null, session?.userId ?? null, params.itemId]
      );

      await logAudit(session?.userId ?? null, "update", "inventory_validation_item", Number(params.itemId), { actual_quantity, status });

      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error updating validation item:", error);
    return NextResponse.json(
      { error: "Error al actualizar el ítem de validación" },
      { status: 500 }
    );
  }
}
