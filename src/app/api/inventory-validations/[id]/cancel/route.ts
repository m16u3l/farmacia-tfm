import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/config/db";
import { getSessionFromRequest } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE inventory_validations
         SET status = 'cancelled', completed_at = NOW()
         WHERE validation_id = $1 AND status = 'in_progress'
         RETURNING *`,
        [params.id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "La validación no existe o ya no está en progreso" },
          { status: 409 }
        );
      }

      const session = await getSessionFromRequest(request);
      await logAudit(session?.userId ?? null, "update", "inventory_validation", Number(params.id), { action: "cancel" });

      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error cancelling inventory validation:", error);
    return NextResponse.json(
      { error: "Error al cancelar la validación de inventario" },
      { status: 500 }
    );
  }
}
