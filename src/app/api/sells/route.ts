import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/config/db";
import { getSessionFromRequest } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    // admin ve todas las ventas; los demás roles solo ven las que ellos registraron
    const isAdmin = session?.role === "admin";
    const client = await pool.connect();
    try {
      const result = await client.query(
        `
        SELECT
          s.*,
          u.first_name || ' ' || u.last_name as user_name,
          json_agg(
            json_build_object(
              'sell_item_id', si.sell_item_id,
              'inventory_id', si.inventory_id,
              'quantity', si.quantity,
              'unit_price', si.unit_price,
              'subtotal', si.subtotal,
              'inventory', json_build_object(
                'inventory_id', i.inventory_id,
                'product_name', p.name,
                'product_id', i.product_id
              )
            )
          ) FILTER (WHERE si.sell_item_id IS NOT NULL) as items
        FROM sells s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN sell_items si ON s.sell_id = si.sell_id
        LEFT JOIN inventory i ON si.inventory_id = i.inventory_id
        LEFT JOIN products p ON i.product_id = p.product_id
        ${isAdmin ? "" : "WHERE s.user_id = $1"}
        GROUP BY s.sell_id, u.first_name, u.last_name
        ORDER BY s.sell_date DESC
      `,
        isAdmin ? [] : [session?.userId ?? null]
      );
      if (!result.rows) {
        return NextResponse.json([], { headers: corsHeaders });
      }
      return NextResponse.json(result.rows, { headers: corsHeaders });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching sells:", error);
    return NextResponse.json(
      { error: "Error al obtener las ventas" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { payment_method, items } = data;
    const session = await getSessionFromRequest(request);
    const client = await pool.connect();

    try {
      // Iniciar transacción
      await client.query('BEGIN');

      // Insertar la venta
      const sellResult = await client.query(
        `INSERT INTO sells (user_id, payment_method, sell_date)
         VALUES ($1, $2, NOW()) RETURNING sell_id`,
        [session?.userId ?? null, payment_method]
      );

      const sellId = sellResult.rows[0].sell_id;

      // Insertar los items de la venta
      for (const item of items) {
        await client.query(
          `INSERT INTO sell_items (sell_id, inventory_id, quantity, unit_price, subtotal)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            sellId,
            item.inventory_id,
            item.quantity,
            item.unit_price,
            item.subtotal,
          ]
        );

        // Actualizar el inventario
        await client.query(
          `UPDATE inventory
           SET quantity_available = quantity_available - $1
           WHERE inventory_id = $2`,
          [item.quantity, item.inventory_id]
        );
      }

      // Actualizar el total de la venta
      const total = items.reduce((sum: number, item: { subtotal: number }) => sum + item.subtotal, 0);
      await client.query(
        `UPDATE sells
         SET total_amount = $1
         WHERE sell_id = $2`,
        [total, sellId]
      );

      // Confirmar la transacción
      await client.query('COMMIT');

      await logAudit(session?.userId ?? null, "create", "sell", sellId, { total, items: items.length });

      return NextResponse.json({ id: sellId }, { status: 201 });
    } catch (error) {
      // Revertir la transacción en caso de error
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating sell:", error);
    return NextResponse.json(
      { error: "Error al crear la venta" },
      { status: 500 }
    );
  }
}
