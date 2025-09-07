import { NextResponse } from "next/server";
import { pool } from "@/config/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const [sells] = await pool.query(`SELECT * FROM sells WHERE id = ?`, [
      params.id,
    ]);

    if (!sells || sells.length === 0) {
      return NextResponse.json(
        { error: "Venta no encontrada" },
        { status: 404 }
      );
    }

    // Obtener los items de la venta
    const [items] = await pool.query(
      `SELECT * FROM sell_items WHERE sell_id = ?`,
      [params.id]
    );

    return NextResponse.json({ ...sells[0], items });
  } catch (error) {
    console.error("Error fetching sell:", error);
    return NextResponse.json(
      { error: "Error al obtener la venta" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const { customer_id, employee_id, payment_method, items } = data;

    // Iniciar transacción
    await pool.beginTransaction();

    try {
      // Actualizar la venta
      await pool.query(
        `UPDATE sells
         SET customer_id = ?,
             employee_id = ?,
             payment_method = ?
         WHERE id = ?`,
        [customer_id, employee_id, payment_method, params.id]
      );

      // Eliminar items antiguos
      await pool.query(`DELETE FROM sell_items WHERE sell_id = ?`, [params.id]);

      // Insertar nuevos items
      for (const item of items) {
        await pool.query(
          `INSERT INTO sell_items (sell_id, inventory_id, quantity, unit_price, subtotal)
           VALUES (?, ?, ?, ?, ?)`,
          [
            params.id,
            item.inventory_id,
            item.quantity,
            item.unit_price,
            item.subtotal,
          ]
        );
      }

      // Actualizar el total
      const total = items.reduce(
        (sum: number, item: { subtotal: number }) => sum + item.subtotal,
        0
      );
      await pool.query(
        `UPDATE sells
         SET total_amount = ?
         WHERE id = ?`,
        [total, params.id]
      );

      // Confirmar la transacción
      await pool.commit();

      return NextResponse.json({ id: params.id });
    } catch (error) {
      // Revertir la transacción en caso de error
      await pool.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Error updating sell:", error);
    return NextResponse.json(
      { error: "Error al actualizar la venta" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Iniciar transacción
    await pool.beginTransaction();

    try {
      // Eliminar los items de la venta
      await pool.query(`DELETE FROM sell_items WHERE sell_id = ?`, [params.id]);

      // Eliminar la venta
      await pool.query(`DELETE FROM sells WHERE id = ?`, [params.id]);

      // Confirmar la transacción
      await pool.commit();

      return NextResponse.json({});
    } catch (error) {
      // Revertir la transacción en caso de error
      await pool.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Error deleting sell:", error);
    return NextResponse.json(
      { error: "Error al eliminar la venta" },
      { status: 500 }
    );
  }
}
