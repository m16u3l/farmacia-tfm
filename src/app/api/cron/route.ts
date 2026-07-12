import type { NextRequest } from "next/server";
import { pool } from "@/config/db";
import { getConfiguracionThresholds } from "@/lib/configuracion";

// Job semanal invocado por Vercel Cron (ver "crons" en vercel.json), no por
// node-cron: node-cron necesitaba un proceso vivo entre invocaciones, algo
// que no existe en funciones serverless — nunca podía funcionar en
// producción tal como estaba antes. Vercel firma la petición con
// "Authorization: Bearer $CRON_SECRET" automáticamente cuando esa variable
// de entorno está configurada en el proyecto.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { expiry_alert_days, low_stock_threshold } = await getConfiguracionThresholds(pool);

  const [expired, expiring, lowStock] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS count FROM inventory
       WHERE expiry_date IS NOT NULL AND expiry_date < CURRENT_DATE AND quantity_available > 0`
    ),
    pool.query(
      `SELECT COUNT(*)::int AS count FROM inventory
       WHERE expiry_date IS NOT NULL
         AND expiry_date >= CURRENT_DATE
         AND expiry_date <= CURRENT_DATE + ($1 || ' days')::interval
         AND quantity_available > 0`,
      [expiry_alert_days]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS count FROM inventory WHERE quantity_available <= $1`,
      [low_stock_threshold]
    ),
  ]);

  const summary = {
    expired_lots: expired.rows[0].count,
    expiring_soon_lots: expiring.rows[0].count,
    low_stock_lots: lowStock.rows[0].count,
    expiry_alert_days,
    low_stock_threshold,
  };

  console.log("Chequeo semanal de vencimientos/stock:", summary);

  return Response.json({ success: true, ...summary });
}
