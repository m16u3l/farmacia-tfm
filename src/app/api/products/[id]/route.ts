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
      const result = await client.query("SELECT * FROM products WHERE product_id = $1", [params.id]);
      if (result.rows.length === 0) {
        return NextResponse.json({ message: "Producto no encontrado" }, { status: 404 });
      }
      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const body = await request.json();
    const {
      name,
      description,
      possible_uses,
      additional_info,
      category,
      type,
      dosage_form,
      unit,
      dosage_instructions,
      barcode,
      status,
    } = body;
    const client = await pool.connect();
    try {
      await client.query(
        `UPDATE products
         SET name = $1, description = $2, possible_uses = $3, additional_info = $4, category = $5, type = $6,
             dosage_form = $7, unit = $8, dosage_instructions = $9, barcode = $10, status = $11
         WHERE product_id = $12`,
        [name, description, possible_uses ?? null, additional_info ?? null, category, type, dosage_form, unit, dosage_instructions ?? null, barcode, status, params.id]
      );
      const session = await getSessionFromRequest(request);
      await logAudit(session?.userId ?? null, "update", "product", Number(params.id), { name });
      return NextResponse.json({ product_id: params.id, ...body });
    } finally {
      client.release();
    }
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
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
      await client.query("DELETE FROM products WHERE product_id = $1", [params.id]);
      const session = await getSessionFromRequest(request);
      await logAudit(session?.userId ?? null, "delete", "product", Number(params.id));
      return NextResponse.json({ message: "Producto eliminado" });
    } finally {
      client.release();
    }
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
