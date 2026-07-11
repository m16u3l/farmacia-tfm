import { NextRequest, NextResponse } from "next/server";
import { PoolClient } from "pg";
import { pool } from "@/config/db";
import { getSessionFromRequest } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

// Recalcula los totales cacheados de un cierre de caja a partir de sus
// ventas miembro actuales — necesario cuando un admin edita/elimina una
// venta que ya pertenece a un cierre, para que el snapshot no quede obsoleto.
async function recalculateClosureTotals(client: PoolClient, closureId: number) {
  const totals = await client.query(
    `SELECT
       COUNT(*)::int AS sell_count,
       COALESCE(SUM(total_amount), 0) AS total_amount,
       COALESCE(SUM(total_amount) FILTER (WHERE payment_method = 'efectivo'), 0) AS total_efectivo,
       COALESCE(SUM(total_amount) FILTER (WHERE payment_method = 'qr_transferencia'), 0) AS total_qr_transferencia
     FROM sells WHERE closure_id = $1`,
    [closureId]
  );
  const { sell_count, total_amount, total_efectivo, total_qr_transferencia } = totals.rows[0];
  await client.query(
    `UPDATE cash_register_closures
     SET sell_count = $1, total_amount = $2, total_efectivo = $3, total_qr_transferencia = $4,
         cash_difference = counted_cash - $3
     WHERE closure_id = $5`,
    [sell_count, total_amount, total_efectivo, total_qr_transferencia, closureId]
  );
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const sellsResult = await pool.query(`SELECT * FROM sells WHERE sell_id = $1`, [
      params.id,
    ]);

    const sells = sellsResult.rows;

    if (!sells || sells.length === 0) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
    }

    // Obtener los items de la venta
    const itemsResult = await pool.query(`SELECT * FROM sell_items WHERE sell_id = $1`, [
      params.id,
    ]);

    const items = itemsResult.rows;

    return NextResponse.json({ ...sells[0], items });
  } catch (error) {
    console.error("Error fetching sell:", error);
    return NextResponse.json({ error: "Error al obtener la venta" }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const data = await request.json();
    const { payment_method, items } = data;
    const session = await getSessionFromRequest(request as NextRequest);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const existing = await client.query(
        `SELECT closure_id FROM sells WHERE sell_id = $1`,
        [params.id]
      );
      const closureId = existing.rows[0]?.closure_id ?? null;
      if (closureId !== null && session?.role !== "admin") {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "Esta venta ya fue incluida en un cierre de caja y no puede modificarse" },
          { status: 403 }
        );
      }

      // Actualizar la venta
      await client.query(
        `UPDATE sells
         SET payment_method = $1
         WHERE sell_id = $2`,
        [payment_method, params.id]
      );

      // Eliminar items antiguos
      await client.query(`DELETE FROM sell_items WHERE sell_id = $1`, [params.id]);

      // Insertar nuevos items
      for (const item of items) {
        await client.query(
          `INSERT INTO sell_items (sell_id, inventory_id, quantity, unit_price, subtotal)
           VALUES ($1, $2, $3, $4, $5)`,
          [params.id, item.inventory_id, item.quantity, item.unit_price, item.subtotal]
        );
      }

      // Actualizar el total
      const total = items.reduce((sum: number, item: { subtotal: number }) => sum + item.subtotal, 0);
      await client.query(`UPDATE sells SET total_amount = $1 WHERE sell_id = $2`, [total, params.id]);

      // Si la venta pertenece a un cierre (edición por admin), recalcular los
      // totales del cierre para que no queden desactualizados
      if (closureId !== null) {
        await recalculateClosureTotals(client, closureId);
      }

      // Confirmar la transacción
      await client.query("COMMIT");

      await logAudit(session?.userId ?? null, "update", "sell", Number(params.id), { total });

      return NextResponse.json({ id: params.id });
    } catch (error) {
      // Revertir la transacción en caso de error
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error updating sell:", error);
    return NextResponse.json(
      { error: "Error al actualizar la venta" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    const session = await getSessionFromRequest(request as NextRequest);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const existing = await client.query(
        `SELECT closure_id FROM sells WHERE sell_id = $1`,
        [params.id]
      );
      const closureId = existing.rows[0]?.closure_id ?? null;
      if (closureId !== null && session?.role !== "admin") {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "Esta venta ya fue incluida en un cierre de caja y no puede eliminarse" },
          { status: 403 }
        );
      }

      // Eliminar los items de la venta
      await client.query(`DELETE FROM sell_items WHERE sell_id = $1`, [params.id]);

      // Eliminar la venta
      await client.query(`DELETE FROM sells WHERE sell_id = $1`, [params.id]);

      // Si la venta pertenecía a un cierre (eliminación por admin), recalcular
      // los totales del cierre para que no queden desactualizados
      if (closureId !== null) {
        await recalculateClosureTotals(client, closureId);
      }

      // Confirmar la transacción
      await client.query("COMMIT");

      await logAudit(session?.userId ?? null, "delete", "sell", Number(params.id));

      return NextResponse.json({});
    } catch (error) {
      // Revertir la transacción en caso de error
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error deleting sell:", error);
    return NextResponse.json(
      { error: "Error al eliminar la venta" },
      { status: 500 }
    );
  }
}
