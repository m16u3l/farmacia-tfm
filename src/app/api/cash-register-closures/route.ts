import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/config/db";
import { getSessionFromRequest } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    const isAdmin = session?.role === "admin";
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("user_id");

    // admin puede ver todos los cierres (opcionalmente filtrando por usuario);
    // los demás roles solo ven los propios
    const userId = isAdmin ? requestedUserId : String(session?.userId ?? "");

    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT
          c.*,
          u.first_name || ' ' || u.last_name as user_name
        FROM cash_register_closures c
        LEFT JOIN users u ON c.user_id = u.id
        ${userId ? "WHERE c.user_id = $1" : ""}
        ORDER BY c.closed_at DESC`,
        userId ? [userId] : []
      );
      return NextResponse.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching cash register closures:", error);
    return NextResponse.json(
      { error: "Error al obtener los cierres de caja" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const countedCash = Number(data.counted_cash);
    const notes = data.notes || null;

    if (Number.isNaN(countedCash) || countedCash < 0) {
      return NextResponse.json(
        { error: "El efectivo contado es obligatorio y debe ser un número válido" },
        { status: 400 }
      );
    }

    const session = await getSessionFromRequest(request);
    const userId = session?.userId ?? null;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Bloquea las ventas pendientes del usuario para evitar que dos
      // cierres concurrentes tomen las mismas ventas (misma garantía que
      // el FOR UPDATE de inventory-validations/apply-adjustments).
      const pending = await client.query(
        `SELECT sell_id, sell_date, total_amount, payment_method
         FROM sells
         WHERE user_id = $1 AND closure_id IS NULL
         FOR UPDATE`,
        [userId]
      );

      if (pending.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "No hay ventas pendientes de cierre" },
          { status: 400 }
        );
      }

      const sellIds = pending.rows.map((r) => r.sell_id);
      const sellCount = pending.rows.length;
      const totalAmount = pending.rows.reduce((sum, r) => sum + Number(r.total_amount), 0);
      const totalEfectivo = pending.rows
        .filter((r) => r.payment_method === "efectivo")
        .reduce((sum, r) => sum + Number(r.total_amount), 0);
      const totalQr = pending.rows
        .filter((r) => r.payment_method === "qr_transferencia")
        .reduce((sum, r) => sum + Number(r.total_amount), 0);
      const periodStart = pending.rows.reduce(
        (min, r) => (r.sell_date < min ? r.sell_date : min),
        pending.rows[0].sell_date
      );
      const periodEnd = pending.rows.reduce(
        (max, r) => (r.sell_date > max ? r.sell_date : max),
        pending.rows[0].sell_date
      );
      const cashDifference = countedCash - totalEfectivo;

      const closureResult = await client.query(
        `INSERT INTO cash_register_closures
          (user_id, period_start, period_end, sell_count, total_amount, total_efectivo,
           total_qr_transferencia, counted_cash, cash_difference, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          userId,
          periodStart,
          periodEnd,
          sellCount,
          totalAmount,
          totalEfectivo,
          totalQr,
          countedCash,
          cashDifference,
          notes,
        ]
      );
      const closure = closureResult.rows[0];

      await client.query(
        `UPDATE sells SET closure_id = $1 WHERE sell_id = ANY($2::int[])`,
        [closure.closure_id, sellIds]
      );

      await client.query("COMMIT");

      await logAudit(userId, "create", "cash_register_closure", closure.closure_id, {
        sell_count: sellCount,
        total_amount: totalAmount,
        cash_difference: cashDifference,
      });

      return NextResponse.json(closure, { status: 201 });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating cash register closure:", error);
    return NextResponse.json(
      { error: "Error al crear el cierre de caja" },
      { status: 500 }
    );
  }
}
