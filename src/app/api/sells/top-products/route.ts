import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/config/db";
import { getSessionFromRequest } from "@/lib/auth";
import { corsHeaders } from "@/lib/cors";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Ranking de productos vendidos en un rango de fechas. sell_items solo guarda
// inventory_id (un lote), así que hay que subir hasta products para que los
// distintos lotes de un mismo producto sumen en una sola fila.
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    const isAdmin = session?.role === "admin";

    const from = request.nextUrl.searchParams.get("from");
    const to = request.nextUrl.searchParams.get("to");
    if (!from || !to || !DATE_RE.test(from) || !DATE_RE.test(to)) {
      return NextResponse.json(
        { error: "Rango de fechas inválido" },
        { status: 400, headers: corsHeaders }
      );
    }

    const client = await pool.connect();
    try {
      const params: (string | number | null)[] = [from, to];
      // Los no-admin solo ven sus propias ventas, igual que el resto de reportes.
      let userFilter = "";
      if (!isAdmin) {
        params.push(session?.userId ?? null);
        userFilter = `AND s.user_id = $${params.length}`;
      }

      // Costo y ganancia solo para admin (unit_cost es el costo congelado al
      // momento de la venta).
      const profitColumns = isAdmin
        ? `,
               ROUND(SUM(si.quantity * COALESCE(si.unit_cost, 0)), 2)::float8 AS total_cost,
               ROUND(SUM(si.subtotal - si.quantity * COALESCE(si.unit_cost, 0)), 2)::float8 AS total_profit`
        : "";

      // Rango semiabierto: aprovecha idx_sells_sell_date y no pierde las ventas
      // del último día (sell_date es TIMESTAMP, no DATE).
      const result = await client.query(
        `SELECT
           p.product_id,
           p.name AS product_name,
           p.category,
           p.unit,
           SUM(si.quantity)::int AS total_quantity,
           ROUND(SUM(si.subtotal), 2)::float8 AS total_revenue,
           COUNT(DISTINCT s.sell_id)::int AS sell_count${profitColumns}
         FROM sell_items si
         JOIN sells s ON s.sell_id = si.sell_id
         JOIN inventory i ON i.inventory_id = si.inventory_id
         JOIN products p ON p.product_id = i.product_id
         WHERE s.sell_date >= $1::date
           AND s.sell_date < $2::date + INTERVAL '1 day'
           ${userFilter}
         GROUP BY p.product_id, p.name, p.category, p.unit
         ORDER BY total_quantity DESC
         LIMIT 500`,
        params
      );

      return NextResponse.json(result.rows, { headers: corsHeaders });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching top products report:", error);
    return NextResponse.json(
      { error: "Error al obtener el reporte de productos más vendidos" },
      { status: 500, headers: corsHeaders }
    );
  }
}
