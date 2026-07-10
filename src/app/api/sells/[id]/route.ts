import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/config/db";
import { getSessionFromRequest } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

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

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

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

      // Confirmar la transacción
      await client.query("COMMIT");

      const session = await getSessionFromRequest(request as NextRequest);
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
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Eliminar los items de la venta
      await client.query(`DELETE FROM sell_items WHERE sell_id = $1`, [params.id]);

      // Eliminar la venta
      await client.query(`DELETE FROM sells WHERE sell_id = $1`, [params.id]);

      // Confirmar la transacción
      await client.query("COMMIT");

      const session = await getSessionFromRequest(request as NextRequest);
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
