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
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
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
			await client.query(
				`UPDATE products 
				 SET name = $1, description = $2, category = $3, type = $4, 
				     dosage_form = $5, unit = $6, barcode = $7, status = $8 
				 WHERE product_id = $9`,
				[name, description, category, type, dosage_form, unit, barcode, status, params.id]
			);
			return NextResponse.json({ product_id: params.id, ...body });
		} finally {
			client.release();
		}
	} catch (error) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
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
			await client.query("DELETE FROM products WHERE product_id = $1", [params.id]);
			return NextResponse.json({ message: "Producto eliminado" });
		} finally {
			client.release();
		}
	} catch (error) {
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}
