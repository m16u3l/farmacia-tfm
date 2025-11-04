import { NextResponse } from "next/server";
import { pool } from "@/config/db";

// GET - Obtener una orden específica
export async function GET(request: Request, context: unknown) {
  const { params } = context as { params: { id: string } };
  try {
    const id = params.id;

    // Obtener orden
    const orderResult = await pool.query(
      `SELECT 
        o.*,
        s.name as supplier_name
       FROM orders o
       LEFT JOIN suppliers s ON o.supplier_id = s.supplier_id
       WHERE o.order_id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 }
      );
    }

    const order = orderResult.rows[0];

    // Obtener items de la orden
    const itemsResult = await pool.query(
      `SELECT 
        oi.*,
        p.name as product_name
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.product_id
       WHERE oi.order_id = $1`,
      [id]
    );

    order.items = itemsResult.rows;

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error al obtener orden:", error);
    return NextResponse.json(
      { error: "Error al obtener orden" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar orden
export async function PUT(request: Request, context: unknown) {
  const { params } = context as { params: { id: string } };
  try {
    const id = params.id;
    const body = await request.json();
    const { supplier_id, order_date, status, total_amount, items } = body;

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Actualizar orden
      const result = await client.query(
        `UPDATE orders 
         SET supplier_id = $1, order_date = $2, status = $3, total_amount = $4
         WHERE order_id = $5
         RETURNING *`,
        [supplier_id, order_date, status, total_amount, id]
      );

      if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "Orden no encontrada" },
          { status: 404 }
        );
      }

      // Si se proporcionan items, actualizar
      if (items) {
        // Eliminar items existentes
        await client.query("DELETE FROM order_items WHERE order_id = $1", [id]);

        // Insertar nuevos items
        for (const item of items) {
          await client.query(
            `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
             VALUES ($1, $2, $3, $4)`,
            [id, item.product_id, item.quantity, item.unit_price]
          );
        }
      }

      await client.query("COMMIT");

      return NextResponse.json(result.rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error al actualizar orden:", error);
    return NextResponse.json(
      { error: "Error al actualizar orden" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar orden
export async function DELETE(request: Request, context: unknown) {
  const { params } = context as { params: { id: string } };
  try {
    const id = params.id;
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Eliminar items de la orden
      await client.query("DELETE FROM order_items WHERE order_id = $1", [id]);

      // Eliminar orden
      const result = await client.query(
        "DELETE FROM orders WHERE order_id = $1 RETURNING *",
        [id]
      );

      if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "Orden no encontrada" },
          { status: 404 }
        );
      }

      await client.query("COMMIT");

      return NextResponse.json({ message: "Orden eliminada correctamente" });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error al eliminar orden:", error);
    return NextResponse.json(
      { error: "Error al eliminar orden" },
      { status: 500 }
    );
  }
}
