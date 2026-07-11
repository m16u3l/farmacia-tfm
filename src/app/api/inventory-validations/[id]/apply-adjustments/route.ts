import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/config/db";
import { getSessionFromRequest } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const validationId = Number(params.id);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Bloquea la sesión primero para serializar intentos concurrentes de aplicar
    // ajustes sobre la misma validación (la revalidación de inventory_adjusted_at
    // dentro de la transacción es la garantía real de idempotencia, no solo el
    // deshabilitado del botón en el cliente).
    const validationResult = await client.query(
      `SELECT * FROM inventory_validations WHERE validation_id = $1 FOR UPDATE`,
      [validationId]
    );

    if (validationResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Validación de inventario no encontrada" },
        { status: 404 }
      );
    }

    const validation = validationResult.rows[0];

    if (validation.status !== "completed") {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Solo se pueden aplicar ajustes de una validación completada" },
        { status: 409 }
      );
    }

    if (validation.inventory_adjusted_at) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Los ajustes de esta validación ya fueron aplicados" },
        { status: 409 }
      );
    }

    // Ítems a ajustar: los verificados con discrepancia de cantidad y/o con una
    // fecha de vencimiento corregida, cuyo lote de inventario todavía existe.
    // Los 'pending' quedan excluidos (nunca se ajustan, no hay evidencia física).
    const itemsResult = await client.query(
      `SELECT validation_item_id, inventory_id, expected_quantity, actual_quantity,
              actual_expiry_date, status
       FROM inventory_validation_items
       WHERE validation_id = $1
         AND inventory_id IS NOT NULL
         AND (status IN ('inconsistent', 'not_found') OR actual_expiry_date IS NOT NULL)
       ORDER BY validation_item_id
       FOR UPDATE`,
      [validationId]
    );

    const applied: {
      inventory_id: number;
      quantity?: { from: number; to: number };
      expiry_date?: { from: string | null; to: string };
    }[] = [];
    const skipped: { validation_item_id: number; inventory_id: number | null; reason: string }[] = [];

    for (const item of itemsResult.rows) {
      const invResult = await client.query(
        `SELECT inventory_id, quantity_available, expiry_date FROM inventory WHERE inventory_id = $1 FOR UPDATE`,
        [item.inventory_id]
      );

      if (invResult.rows.length === 0) {
        skipped.push({
          validation_item_id: item.validation_item_id,
          inventory_id: item.inventory_id,
          reason: "inventory_row_deleted",
        });
        continue;
      }

      const current = invResult.rows[0];
      const setClauses: string[] = [];
      const setValues: unknown[] = [];
      const entry: (typeof applied)[number] = { inventory_id: item.inventory_id };

      if (item.status === "inconsistent" || item.status === "not_found") {
        // not_found: se asume conteo real 0 (la fila se conserva, no se elimina).
        const newQty = item.status === "not_found" ? 0 : item.actual_quantity;
        if (newQty !== current.quantity_available) {
          setClauses.push(`quantity_available = $${setValues.length + 1}`);
          setValues.push(newQty);
          entry.quantity = { from: current.quantity_available, to: newQty };
        }
      }

      if (item.actual_expiry_date) {
        const currentExpiry = current.expiry_date
          ? new Date(current.expiry_date).toISOString().split("T")[0]
          : null;
        const newExpiry = new Date(item.actual_expiry_date).toISOString().split("T")[0];
        if (newExpiry !== currentExpiry) {
          setClauses.push(`expiry_date = $${setValues.length + 1}`, `expiry_is_approximate = FALSE`);
          setValues.push(newExpiry);
          entry.expiry_date = { from: currentExpiry, to: newExpiry };
        }
      }

      if (setClauses.length === 0) {
        continue;
      }

      setValues.push(item.inventory_id);
      await client.query(
        `UPDATE inventory SET ${setClauses.join(", ")} WHERE inventory_id = $${setValues.length}`,
        setValues
      );
      applied.push(entry);
    }

    const session = await getSessionFromRequest(request);
    const updated = await client.query(
      `UPDATE inventory_validations
       SET inventory_adjusted_at = NOW(), inventory_adjusted_by = $1
       WHERE validation_id = $2
       RETURNING *`,
      [session?.userId ?? null, validationId]
    );

    await client.query("COMMIT");

    await logAudit(session?.userId ?? null, "update", "inventory_validation", validationId, {
      action: "apply_adjustments",
      applied_count: applied.length,
      skipped_count: skipped.length,
      applied,
      skipped,
    });

    return NextResponse.json({ validation: updated.rows[0], applied, skipped });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error applying inventory validation adjustments:", error);
    return NextResponse.json(
      { error: "Error al aplicar los ajustes de inventario" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
