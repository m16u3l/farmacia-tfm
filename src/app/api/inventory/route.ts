import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/config/db";
import { getSessionFromRequest } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { corsHeaders } from "@/lib/cors";

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT
          i.*,
          p.name as product_name,
          p.description as product_description,
          p.category as product_category,
          p.laboratory as product_laboratory,
          p.active_ingredient as product_active_ingredient,
          p.concentration as product_concentration,
          p.barcode as product_barcode,
          p.sale_control as product_sale_control,
          a.name as area_name
        FROM inventory i
        LEFT JOIN products p ON i.product_id = p.product_id
        LEFT JOIN inventory_areas a ON i.area_id = a.area_id
        ORDER BY i.inventory_id DESC
      `);
      if (!result.rows) {
        return NextResponse.json([], { headers: corsHeaders });
      }
      return NextResponse.json(result.rows, { headers: corsHeaders });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      { error: "Error al obtener el inventario" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const session = await getSessionFromRequest(request);
    const client = await pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO inventory (
          product_id, batch_number, expiry_date, quantity_available,
          area_id, purchase_price, sale_price, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [product_id, batch_number, expiry_date, quantity_available, area_id || null, purchase_price, sale_price, session?.userId ?? null]
      );

      await logAudit(session?.userId ?? null, "create", "inventory", result.rows[0].inventory_id, { product_id, quantity_available });

      return NextResponse.json(result.rows[0], { headers: corsHeaders });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating inventory item:", error);
    return NextResponse.json(
      { error: "Error al crear el elemento del inventario" },
      { status: 500, headers: corsHeaders }
    );
  }
}
