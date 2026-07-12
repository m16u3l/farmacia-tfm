import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/config/db";
import { getSessionFromRequest } from "@/lib/auth";
import { corsHeaders } from "@/lib/cors";

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Agrega ventas por día/mes en SQL en vez de traer todas las filas de sells al
// cliente para reducirlas en JS (no escala con el historial de ventas).
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    const isAdmin = session?.role === "admin";
    const granularity = request.nextUrl.searchParams.get("granularity") === "monthly" ? "monthly" : "daily";
    // Fecha puntual (reporte diario) que puede caer fuera de la ventana de los
    // últimos 30 días que trae la tabla de historial.
    const date = granularity === "daily" ? request.nextUrl.searchParams.get("date") : null;

    const client = await pool.connect();
    try {
      const sellTotalsCte = `
        WITH sell_totals AS (
          SELECT s.sell_id, s.sell_date, s.total_amount, s.user_id,
                 COALESCE(SUM(si.quantity), 0) AS quantity
          FROM sells s
          LEFT JOIN sell_items si ON si.sell_id = s.sell_id
          ${isAdmin ? "" : "WHERE s.user_id = $1"}
          GROUP BY s.sell_id
        )
      `;
      const params: (number | string | null)[] = isAdmin ? [] : [session?.userId ?? null];

      let query: string;
      if (granularity === "monthly" && isAdmin) {
        // Solo para admin: además de las ventas, costo congelado por venta
        // (sell_items.unit_cost) y gastos del mes, para la ganancia neta
        // (ventas − costo de productos − gastos). FULL JOIN para no perder
        // meses que solo tienen gastos.
        query = `
             WITH sell_totals AS (
               SELECT s.sell_id, s.sell_date, s.total_amount,
                      COALESCE(SUM(si.quantity), 0) AS quantity,
                      COALESCE(SUM(si.quantity * COALESCE(si.unit_cost, 0)), 0) AS cost
               FROM sells s
               LEFT JOIN sell_items si ON si.sell_id = s.sell_id
               GROUP BY s.sell_id
             ),
             monthly_sales AS (
               SELECT TO_CHAR(sell_date, 'YYYY-MM') AS month,
                      COUNT(*)::int AS total_sales,
                      SUM(total_amount) AS total_amount,
                      SUM(quantity)::int AS products_sold,
                      SUM(cost) AS total_cost
               FROM sell_totals
               GROUP BY TO_CHAR(sell_date, 'YYYY-MM')
             ),
             monthly_expenses AS (
               SELECT TO_CHAR(expense_date, 'YYYY-MM') AS month,
                      SUM(amount) AS total_expenses
               FROM expenses
               GROUP BY TO_CHAR(expense_date, 'YYYY-MM')
             )
             SELECT
               COALESCE(ms.month, me.month) AS month,
               SPLIT_PART(COALESCE(ms.month, me.month), '-', 1)::int AS year,
               COALESCE(ms.total_sales, 0) AS total_sales,
               COALESCE(ms.total_amount, 0) AS total_amount,
               COALESCE(ms.products_sold, 0) AS products_sold,
               COALESCE(ms.total_cost, 0) AS total_cost,
               COALESCE(me.total_expenses, 0) AS total_expenses,
               COALESCE(ms.total_amount, 0) - COALESCE(ms.total_cost, 0)
                 - COALESCE(me.total_expenses, 0) AS net_profit
             FROM monthly_sales ms
             FULL JOIN monthly_expenses me ON me.month = ms.month
             ORDER BY month DESC
             LIMIT 12`;
      } else if (granularity === "monthly") {
        query = `${sellTotalsCte}
             SELECT
               TO_CHAR(sell_date, 'YYYY-MM') AS month,
               EXTRACT(YEAR FROM sell_date)::int AS year,
               COUNT(*)::int AS total_sales,
               SUM(total_amount) AS total_amount,
               SUM(quantity)::int AS products_sold
             FROM sell_totals
             GROUP BY TO_CHAR(sell_date, 'YYYY-MM'), EXTRACT(YEAR FROM sell_date)
             ORDER BY month DESC
             LIMIT 12`;
      } else if (date) {
        params.push(date);
        query = `${sellTotalsCte}
             SELECT
               TO_CHAR(sell_date, 'YYYY-MM-DD') AS date,
               COUNT(*)::int AS total_sales,
               SUM(total_amount) AS total_amount,
               SUM(quantity)::int AS products_sold
             FROM sell_totals
             WHERE TO_CHAR(sell_date, 'YYYY-MM-DD') = $${params.length}
             GROUP BY TO_CHAR(sell_date, 'YYYY-MM-DD')`;
      } else {
        query = `${sellTotalsCte}
             SELECT
               TO_CHAR(sell_date, 'YYYY-MM-DD') AS date,
               COUNT(*)::int AS total_sales,
               SUM(total_amount) AS total_amount,
               SUM(quantity)::int AS products_sold
             FROM sell_totals
             GROUP BY TO_CHAR(sell_date, 'YYYY-MM-DD')
             ORDER BY date DESC
             LIMIT 30`;
      }

      const result = await client.query(query, params);
      return NextResponse.json(result.rows, { headers: corsHeaders });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching sells report:", error);
    return NextResponse.json(
      { error: "Error al obtener el reporte de ventas" },
      { status: 500, headers: corsHeaders }
    );
  }
}
