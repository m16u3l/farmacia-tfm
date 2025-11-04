import { NextResponse } from "next/server";
import { pool } from "@/config/db";

// GET - Obtener todas las órdenes
export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        o.*,
        s.name as supplier_name
      FROM orders o
      LEFT JOIN suppliers s ON o.supplier_id = s.supplier_id
      ORDER BY o.order_date DESC
    `);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error al obtener órdenes:", error);
    return NextResponse.json(
      { error: "Error al obtener órdenes" },
      { status: 500 }
    );
  }
}

// POST - Crear nueva orden
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { supplier_id, order_date, status, total_amount, items } = body;

    // Validaciones
    if (!supplier_id || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    
    try {
      await client.query("BEGIN");

      // Insertar orden
      const orderResult = await client.query(
        `INSERT INTO orders (supplier_id, order_date, status, total_amount)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [supplier_id, order_date || new Date().toISOString(), status || 'pendiente', total_amount]
      );

      const order = orderResult.rows[0];

      // Insertar items de la orden
      for (const item of items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
           VALUES ($1, $2, $3, $4)`,
          [order.order_id, item.product_id, item.quantity, item.unit_price]
        );
      }

      await client.query("COMMIT");
      
      return NextResponse.json(order, { status: 201 });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error al crear orden:", error);
    return NextResponse.json(
      { error: "Error al crear orden" },
      { status: 500 }
    );
  }
}
