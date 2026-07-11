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
    const session = await getSessionFromRequest(request);
    if (session?.role !== "admin") {
      return NextResponse.json(
        { error: "Solo un administrador puede anular un cierre de caja" },
        { status: 403 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const result = await client.query(
        `UPDATE cash_register_closures
         SET status = 'cancelled', cancelled_by = $1, cancelled_at = NOW()
         WHERE closure_id = $2 AND status = 'closed'
         RETURNING *`,
        [session.userId, params.id]
      );

      if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "El cierre no existe o ya fue anulado" },
          { status: 409 }
        );
      }

      // Libera las ventas para que vuelvan a estar disponibles para editar/eliminar
      // y para ser incluidas en un próximo cierre
      await client.query(
        `UPDATE sells SET closure_id = NULL WHERE closure_id = $1`,
        [params.id]
      );

      await client.query("COMMIT");

      await logAudit(session.userId, "update", "cash_register_closure", Number(params.id), {
        action: "cancel",
      });

      return NextResponse.json(result.rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error cancelling cash register closure:", error);
    return NextResponse.json(
      { error: "Error al anular el cierre de caja" },
      { status: 500 }
    );
  }
}
