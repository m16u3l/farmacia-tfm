import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/config/db";
import { getSessionFromRequest } from "@/lib/auth";
import { getConfiguracionThresholds } from "@/lib/configuracion";

// Estadísticas del panel agregadas en SQL: antes el dashboard descargaba
// products/inventory/sells/orders completos solo para contarlos en el
// navegador, y el "bajo stock" usaba un 10 hardcodeado en vez del umbral de
// configuración (global o por producto).
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    // Igual que GET /api/sells: los roles no-admin solo cuentan sus propias ventas.
    const isAdmin = session?.role === "admin";
    const { low_stock_threshold } = await getConfiguracionThresholds(pool);

    const [products, lowStock, sellsToday, pendingOrders] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS count FROM products WHERE status = TRUE`),
      pool.query(
        `SELECT COUNT(*)::int AS count
         FROM inventory i
         JOIN products p ON p.product_id = i.product_id
         WHERE i.quantity_available > 0
           AND i.quantity_available <= COALESCE(p.low_stock_threshold, $1)`,
        [low_stock_threshold]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS count FROM sells
         WHERE sell_date::date = CURRENT_DATE ${isAdmin ? "" : "AND user_id = $1"}`,
        isAdmin ? [] : [session?.userId ?? null]
      ),
      pool.query(`SELECT COUNT(*)::int AS count FROM orders WHERE status = 'pendiente'`),
    ]);

    return NextResponse.json({
      products: products.rows[0].count,
      low_stock_lots: lowStock.rows[0].count,
      sells_today: sellsToday.rows[0].count,
      pending_orders: pendingOrders.rows[0].count,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Error al obtener las estadísticas del panel" },
      { status: 500 }
    );
  }
}
