import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/config/db";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const session = await getSessionFromRequest(request);
    const client = await pool.connect();
    try {
      const closureResult = await client.query(
        `SELECT
          c.*,
          u.first_name || ' ' || u.last_name as user_name
        FROM cash_register_closures c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.closure_id = $1`,
        [params.id]
      );

      if (closureResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Cierre de caja no encontrado" },
          { status: 404 }
        );
      }

      const closure = closureResult.rows[0];
      const isAdmin = session?.role === "admin";
      if (!isAdmin && closure.user_id !== session?.userId) {
        return NextResponse.json(
          { error: "No tiene permiso para ver este cierre de caja" },
          { status: 403 }
        );
      }

      const sellsResult = await client.query(
        `SELECT sell_id, sell_date, total_amount, payment_method
         FROM sells WHERE closure_id = $1
         ORDER BY sell_date`,
        [params.id]
      );

      return NextResponse.json({ ...closure, sells: sellsResult.rows });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching cash register closure:", error);
    return NextResponse.json(
      { error: "Error al obtener el cierre de caja" },
      { status: 500 }
    );
  }
}
