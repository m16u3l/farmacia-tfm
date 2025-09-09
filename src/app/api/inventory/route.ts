import { NextResponse } from "next/server";
import { pool } from "@/config/db";

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          i.*,
          p.name as product_name,
          p.description as product_description,
          p.category as product_category
        FROM inventory i
        LEFT JOIN products p ON i.product_id = p.product_id
        ORDER BY i.inventory_id DESC
      `);
      return NextResponse.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json(
      { error: "Error al obtener el inventario" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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
      const result = await client.query(`
        INSERT INTO inventory (
          product_id, batch_number, expiry_date, quantity_available, 
          location, purchase_price, sale_price
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING *`,
        [product_id, batch_number, expiry_date, quantity_available, location, purchase_price, sale_price]
      );
      
      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating inventory item:", error);
    return NextResponse.json(
      { error: "Error al crear el elemento del inventario" },
      { status: 500 }
    );
  }
}
