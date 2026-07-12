import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/config/db";
import { getSessionFromRequest } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

// GET - Obtener una solicitud específica
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const id = params.id;

    const result = await pool.query(
      `SELECT
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
       WHERE o.order_id = $1
       GROUP BY o.order_id`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener orden:", error);
    return NextResponse.json(
      { error: "Error al obtener orden" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar solicitud (nota, estado y/o productos)
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const id = params.id;
    const body = await request.json();
    const { status, note, product_ids } = body;

    if (status && !["pendiente", "comprado", "descartado"].includes(status)) {
      return NextResponse.json(
        { error: "Estado inválido" },
        { status: 400 }
      );
    }
    if (product_ids && (!Array.isArray(product_ids) || product_ids.length === 0)) {
      return NextResponse.json(
        { error: "Selecciona al menos un producto faltante" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const result = await client.query(
        `UPDATE orders
         SET status = COALESCE($1, status), note = COALESCE($2, note)
         WHERE order_id = $3
         RETURNING *`,
        [status ?? null, note ?? null, id]
      );

      if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "Orden no encontrada" },
          { status: 404 }
        );
      }

      if (product_ids) {
        await client.query("DELETE FROM order_items WHERE order_id = $1", [id]);
        for (const productId of product_ids) {
          await client.query(
            `INSERT INTO order_items (order_id, product_id) VALUES ($1, $2)`,
            [id, productId]
          );
        }
      }

      await client.query("COMMIT");

      const session = await getSessionFromRequest(request as NextRequest);
      await logAudit(session?.userId ?? null, "update", "order", Number(id), { status, note, product_ids });

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

// DELETE - Eliminar solicitud
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const id = params.id;
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      await client.query("DELETE FROM order_items WHERE order_id = $1", [id]);

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

      const session = await getSessionFromRequest(request as NextRequest);
      await logAudit(session?.userId ?? null, "delete", "order", Number(id));

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
