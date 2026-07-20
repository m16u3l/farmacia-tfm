import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/config/db";
import { getSessionFromRequest } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { corsHeaders } from "@/lib/cors";

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET - Obtener todas las solicitudes de reposición
export async function GET() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT
        o.order_id,
        o.order_date,
        o.status,
        o.note,
        COALESCE(
          json_agg(json_build_object('product_id', p.product_id, 'name', p.name))
            FILTER (WHERE p.product_id IS NOT NULL),
          '[]'
        ) AS products
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.order_id
      LEFT JOIN products p ON p.product_id = oi.product_id
      GROUP BY o.order_id
      ORDER BY o.order_date DESC
    `);
    return NextResponse.json(result.rows, { headers: corsHeaders });
  } catch (error) {
    console.error("Error al obtener órdenes:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al obtener órdenes" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// POST - Crear nueva solicitud de reposición (productos faltantes + nota)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { product_ids, note } = body;

    if (!Array.isArray(product_ids) || product_ids.length === 0) {
      return NextResponse.json(
        { error: "Selecciona al menos un producto faltante" },
        { status: 400 }
      );
    }

    const session = await getSessionFromRequest(request);
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const orderResult = await client.query(
        `INSERT INTO orders (status, note, created_by)
         VALUES ('pendiente', $1, $2)
         RETURNING *`,
        [note || null, session?.userId ?? null]
      );

      const order = orderResult.rows[0];

      const uniqueProductIds = [...new Set(product_ids)];
      for (const productId of uniqueProductIds) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id) VALUES ($1, $2)`,
          [order.order_id, productId]
        );
      }

      await client.query("COMMIT");

      await logAudit(session?.userId ?? null, "create", "order", order.order_id, { product_ids, note });

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
