import { NextResponse } from "next/server";
import { pool } from "@/config/db";

export async function GET() {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT * FROM products ORDER BY product_id DESC"
    );
    if (!result.rows) {
      return NextResponse.json([], { status: 200 });
    }
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al obtener los productos" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      category,
      type,
      dosage_form,
      unit,
      barcode,
      status,
    } = body;
    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO products (name, description, category, type, dosage_form, unit, barcode, status)
				 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [name, description, category, type, dosage_form, unit, barcode, status]
      );
      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
