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
    const { actual_quantity, actual_expiry_date, notes } = data;

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
      if (actual_quantity === item.expected_quantity) {
        // Coincide con lo esperado — incluye el caso expected=0/actual=0 (un
        // lote que ya figuraba agotado y se confirma que sigue así), que antes
        // se marcaba erróneamente "not_found" solo por chequear actual===0
        // primero. "not_found" queda reservado para cuando se esperaba stock
        // (>0) y no apareció nada físicamente.
        status = "confirmed";
      } else if (actual_quantity === 0) {
        status = "not_found";
      } else {
        status = "inconsistent";
      }

      const session = await getSessionFromRequest(request);
      const result = await client.query(
        `UPDATE inventory_validation_items
         SET actual_quantity = $1, actual_expiry_date = $2, status = $3, notes = $4, verified_by = $5, verified_at = NOW()
         WHERE validation_item_id = $6
         RETURNING *`,
        [actual_quantity, actual_expiry_date || null, status, notes || null, session?.userId ?? null, params.itemId]
      );

      await logAudit(session?.userId ?? null, "update", "inventory_validation_item", Number(params.itemId), {
        actual_quantity,
        actual_expiry_date: actual_expiry_date || null,
        status,
      });

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
