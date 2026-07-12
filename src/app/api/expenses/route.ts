import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/config/db";
import { getSessionFromRequest } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

// El acceso a /api/expenses ya queda restringido a admin por el middleware
// (roleCanAccessApi): /expenses no está en las secciones de los demás roles.

// GET - Obtener todos los gastos
export async function GET() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT
        e.*,
        string_agg(p.name, ', ') AS order_products
      FROM expenses e
      LEFT JOIN order_items oi ON oi.order_id = e.order_id
      LEFT JOIN products p ON p.product_id = oi.product_id
      GROUP BY e.expense_id
      ORDER BY e.expense_date DESC, e.expense_id DESC
    `);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error al obtener gastos:", error);
    return NextResponse.json(
      { error: "Error al obtener gastos" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// POST - Registrar un gasto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, amount, expense_date, description, order_id } = body;

    if (!["administrativo", "orden_compra"].includes(category)) {
      return NextResponse.json({ error: "Categoría inválida" }, { status: 400 });
    }
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "El monto debe ser mayor a 0" },
        { status: 400 }
      );
    }

    const session = await getSessionFromRequest(request);
    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO expenses (category, amount, expense_date, description, order_id, created_by)
         VALUES ($1, $2, COALESCE($3, CURRENT_DATE), $4, $5, $6)
         RETURNING *`,
        [
          category,
          parsedAmount,
          expense_date || null,
          description || null,
          order_id ?? null,
          session?.userId ?? null,
        ]
      );

      const expense = result.rows[0];

      await logAudit(session?.userId ?? null, "create", "expense", expense.expense_id, {
        category,
        amount: parsedAmount,
        order_id: order_id ?? null,
      });

      return NextResponse.json(expense, { status: 201 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error al registrar gasto:", error);
    return NextResponse.json(
      { error: "Error al registrar gasto" },
      { status: 500 }
    );
  }
}
