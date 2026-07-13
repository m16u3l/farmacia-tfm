import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/config/db";
import { getSessionFromRequest } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT
          i.*,
          p.name as product_name,
          p.description as product_description,
          p.category as product_category,
          a.name as area_name
        FROM inventory i
        LEFT JOIN products p ON i.product_id = p.product_id
        LEFT JOIN inventory_areas a ON i.area_id = a.area_id
        WHERE i.inventory_id = $1`,
        [params.id]
      );
      
      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Elemento del inventario no encontrado" },
          { status: 404 }
        );
      }

      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching inventory item:", error);
    return NextResponse.json(
      { error: "Error al obtener el elemento del inventario" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const data = await request.json();
    const {
      product_id,
      batch_number,
      expiry_date,
      quantity_available,
      area_id,
      purchase_price,
      sale_price
    } = data;

    // Un lote sin área queda fuera de las validaciones por área y del estado
    // de cobertura — si aún no tiene ubicación real, usar "Por clasificar".
    if (!area_id) {
      return NextResponse.json(
        { error: "La ubicación es obligatoria" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      // Una edición manual del vencimiento se considera confirmada (ya no aproximada)
      const result = await client.query(
        `UPDATE inventory
         SET product_id = $1, batch_number = $2, expiry_date = $3,
             quantity_available = $4, area_id = $5, purchase_price = $6,
             sale_price = $7, expiry_is_approximate = FALSE
         WHERE inventory_id = $8
         RETURNING *`,
        [product_id, batch_number, expiry_date, quantity_available, area_id, purchase_price, sale_price, params.id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Elemento del inventario no encontrado" },
          { status: 404 }
        );
      }

      const session = await getSessionFromRequest(request);
      await logAudit(session?.userId ?? null, "update", "inventory", Number(params.id), { product_id, quantity_available });

      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error updating inventory item:", error);
    return NextResponse.json(
      { error: "Error al actualizar el elemento del inventario" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        "DELETE FROM inventory WHERE inventory_id = $1 RETURNING *",
        [params.id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Elemento del inventario no encontrado" },
          { status: 404 }
        );
      }

      const session = await getSessionFromRequest(request);
      await logAudit(session?.userId ?? null, "delete", "inventory", Number(params.id));

      return NextResponse.json({ message: "Elemento del inventario eliminado correctamente" });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    return NextResponse.json(
      { error: "Error al eliminar el elemento del inventario" },
      { status: 500 }
    );
  }
}
