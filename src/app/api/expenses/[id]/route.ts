import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/config/db";
import { getSessionFromRequest } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

// PUT - Actualizar un gasto
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const id = params.id;
    const body = await request.json();
    const { category, amount, expense_date, description } = body;

    if (category && !["administrativo", "orden_compra"].includes(category)) {
      return NextResponse.json({ error: "Categoría inválida" }, { status: 400 });
    }
    if (amount !== undefined) {
      const parsedAmount = Number(amount);
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        return NextResponse.json(
          { error: "El monto debe ser mayor a 0" },
          { status: 400 }
        );
      }
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE expenses
         SET category = COALESCE($1, category),
             amount = COALESCE($2, amount),
             expense_date = COALESCE($3, expense_date),
             description = COALESCE($4, description)
         WHERE expense_id = $5
         RETURNING *`,
        [
          category ?? null,
          amount !== undefined ? Number(amount) : null,
          expense_date || null,
          description ?? null,
          id,
        ]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Gasto no encontrado" },
          { status: 404 }
        );
      }

      const session = await getSessionFromRequest(request as NextRequest);
      await logAudit(session?.userId ?? null, "update", "expense", Number(id), {
        category,
        amount,
      });

      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error al actualizar gasto:", error);
    return NextResponse.json(
      { error: "Error al actualizar gasto" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un gasto
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const id = params.id;
    const client = await pool.connect();
    try {
      const result = await client.query(
        "DELETE FROM expenses WHERE expense_id = $1 RETURNING *",
        [id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Gasto no encontrado" },
          { status: 404 }
        );
      }

      const session = await getSessionFromRequest(request as NextRequest);
      await logAudit(session?.userId ?? null, "delete", "expense", Number(id));

      return NextResponse.json({ message: "Gasto eliminado correctamente" });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error al eliminar gasto:", error);
    return NextResponse.json(
      { error: "Error al eliminar gasto" },
      { status: 500 }
    );
  }
}
