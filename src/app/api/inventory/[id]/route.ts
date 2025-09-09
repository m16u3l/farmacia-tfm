import { NextResponse } from "next/server";
import { pool } from "@/config/db";

export async function GET(
  request: Request,
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
          p.category as product_category
        FROM inventory i
        LEFT JOIN products p ON i.product_id = p.product_id
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
  request: Request,
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
      location,
      purchase_price,
      sale_price
    } = data;

    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE inventory 
         SET product_id = $1, batch_number = $2, expiry_date = $3, 
             quantity_available = $4, location = $5, purchase_price = $6, 
             sale_price = $7
         WHERE inventory_id = $8
         RETURNING *`,
        [product_id, batch_number, expiry_date, quantity_available, location, purchase_price, sale_price, params.id]
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
    console.error("Error updating inventory item:", error);
    return NextResponse.json(
      { error: "Error al actualizar el elemento del inventario" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
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
