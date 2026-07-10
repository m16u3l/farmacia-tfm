import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/config/db";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const client = await pool.connect();
    try {
      const validationResult = await client.query(
        `SELECT
          v.*,
          a.name as area_name
        FROM inventory_validations v
        LEFT JOIN inventory_areas a ON v.area_id = a.area_id
        WHERE v.validation_id = $1`,
        [params.id]
      );

      if (validationResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Validación de inventario no encontrada" },
          { status: 404 }
        );
      }

      const itemsResult = await client.query(
        `SELECT
          vi.*,
          p.name as product_name,
          i.batch_number,
          i.expiry_date
        FROM inventory_validation_items vi
        LEFT JOIN inventory i ON vi.inventory_id = i.inventory_id
        LEFT JOIN products p ON i.product_id = p.product_id
        WHERE vi.validation_id = $1
        ORDER BY vi.validation_item_id`,
        [params.id]
      );

      return NextResponse.json({ ...validationResult.rows[0], items: itemsResult.rows });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching inventory validation:", error);
    return NextResponse.json(
      { error: "Error al obtener la validación de inventario" },
      { status: 500 }
    );
  }
}
