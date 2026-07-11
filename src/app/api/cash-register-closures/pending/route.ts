import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/config/db";
import { getSessionFromRequest } from "@/lib/auth";

// Vista previa (sin bloquear ni insertar nada) de lo que un cierre de caja
// incluiría en este momento para el usuario autenticado.
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT
          COUNT(*)::int AS sell_count,
          COALESCE(SUM(total_amount), 0) AS total_amount,
          COALESCE(SUM(total_amount) FILTER (WHERE payment_method = 'efectivo'), 0) AS total_efectivo,
          COALESCE(SUM(total_amount) FILTER (WHERE payment_method = 'qr_transferencia'), 0) AS total_qr_transferencia,
          MIN(sell_date) AS period_start
        FROM sells
        WHERE user_id = $1 AND closure_id IS NULL`,
        [session?.userId ?? null]
      );
      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching pending closure summary:", error);
    return NextResponse.json(
      { error: "Error al obtener el resumen de cierre pendiente" },
      { status: 500 }
    );
  }
}
