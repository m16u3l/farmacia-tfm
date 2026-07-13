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
      laboratory,
      active_ingredient,
      concentration,
      health_registry,
      category,
      type,
      dosage_form,
      unit,
      dosage_instructions,
      barcode,
      sale_control,
      low_stock_threshold,
      status,
    } = body;
    const client = await pool.connect();
    try {
      await client.query(
        `UPDATE products
         SET name = $1, description = $2, possible_uses = $3, additional_info = $4, laboratory = $5, active_ingredient = $6,
             concentration = $7, health_registry = $8, category = $9, type = $10,
             dosage_form = $11, unit = $12, dosage_instructions = $13, barcode = $14, sale_control = $15,
             low_stock_threshold = $16, status = $17
         WHERE product_id = $18`,
        [name, description, possible_uses ?? null, additional_info ?? null, laboratory ?? null, active_ingredient ?? null, concentration ?? null, health_registry ?? null, category, type, dosage_form, unit, dosage_instructions ?? null, barcode, sale_control ?? "libre", low_stock_threshold ?? null, status, params.id]
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
    // 23503: violación de FK — el producto tiene lotes de inventario u otras
    // referencias (ON DELETE RESTRICT).
    if ((error as { code?: string }).code === "23503") {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar el producto porque tiene inventario u otros registros asociados. Desactívalo en su lugar.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
