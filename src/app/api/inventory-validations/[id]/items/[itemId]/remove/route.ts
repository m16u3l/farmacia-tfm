import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/config/db";
import { getSessionFromRequest } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

// Marca que el producto de un ítem de validación ya no está en el área/
// ubicación que se está contando:
//   outcome 'moved': se movió a otra área — el lote se reubica de inmediato
//                    (UPDATE inventory.area_id + rastro en inventory_movements
//                    con reason 'reubicacion') y el ítem queda 'moved'; no
//                    requiere ajuste posterior.
//   outcome 'gone':  ya no existe en el inventario — el ítem queda 'not_found'
//                    con actual_quantity 0; el lote se lleva a 0 recién en el
//                    paso explícito de apply-adjustments (la fila se conserva).
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  const params = await context.params;
  const validationId = Number(params.id);
  const itemId = Number(params.itemId);

  try {
    const data = await request.json();
    const { outcome, notes } = data;

    if (outcome !== "moved" && outcome !== "gone") {
      return NextResponse.json(
        { error: "Resultado inválido: debe ser 'moved' o 'gone'" },
        { status: 400 }
      );
    }

    const session = await getSessionFromRequest(request);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // FOR UPDATE: serializa contra complete/cancel/apply-adjustments de la
      // misma sesión.
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
      if (validationResult.rows[0].status !== "in_progress") {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "Solo se pueden modificar ítems de una validación en progreso" },
          { status: 409 }
        );
      }

      const itemResult = await client.query(
        `SELECT * FROM inventory_validation_items
         WHERE validation_item_id = $1 AND validation_id = $2
         FOR UPDATE`,
        [itemId, validationId]
      );
      if (itemResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "Ítem de validación no encontrado" },
          { status: 404 }
        );
      }
      const item = itemResult.rows[0];

      if (item.status === "added") {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "Los ítems agregados durante la validación no se re-verifican" },
          { status: 409 }
        );
      }

      let itemNotes: string | null = notes || null;

      if (outcome === "moved") {
        const destinationAreaId = Number(data.destination_area_id);
        if (!destinationAreaId) {
          await client.query("ROLLBACK");
          return NextResponse.json(
            { error: "El área de destino es obligatoria" },
            { status: 400 }
          );
        }
        if (!item.inventory_id) {
          await client.query("ROLLBACK");
          return NextResponse.json(
            { error: "El lote de inventario del ítem ya no existe; márcalo como 'ya no existe'" },
            { status: 409 }
          );
        }

        const areaResult = await client.query(
          `SELECT area_id, name FROM inventory_areas WHERE area_id = $1`,
          [destinationAreaId]
        );
        if (areaResult.rows.length === 0) {
          await client.query("ROLLBACK");
          return NextResponse.json(
            { error: "Área de destino no encontrada" },
            { status: 404 }
          );
        }

        const lotResult = await client.query(
          `SELECT * FROM inventory WHERE inventory_id = $1 FOR UPDATE`,
          [item.inventory_id]
        );
        if (lotResult.rows.length === 0) {
          await client.query("ROLLBACK");
          return NextResponse.json(
            { error: "El lote de inventario del ítem ya no existe; márcalo como 'ya no existe'" },
            { status: 409 }
          );
        }
        const lot = lotResult.rows[0];

        if (lot.area_id === destinationAreaId) {
          await client.query("ROLLBACK");
          return NextResponse.json(
            { error: "El lote ya se encuentra en esa área" },
            { status: 409 }
          );
        }

        await client.query(
          `UPDATE inventory SET area_id = $1 WHERE inventory_id = $2`,
          [destinationAreaId, item.inventory_id]
        );
        // Rastro del movimiento solo si hay stock — el CHECK exige quantity > 0.
        if (lot.quantity_available > 0) {
          await client.query(
            `INSERT INTO inventory_movements (
              source_inventory_id, destination_inventory_id, source_area_id,
              destination_area_id, quantity, reason, notes, moved_by
            ) VALUES ($1, $1, $2, $3, $4, 'reubicacion', $5, $6)`,
            [
              item.inventory_id,
              lot.area_id,
              destinationAreaId,
              lot.quantity_available,
              `No encontrado en su área durante la validación #${validationId}`,
              session?.userId ?? null,
            ]
          );
        }

        if (!itemNotes) {
          itemNotes = `Reubicado al área "${areaResult.rows[0].name}"`;
        }

        await client.query(
          `UPDATE inventory_validation_items
           SET actual_quantity = NULL, actual_expiry_date = NULL, status = 'moved',
               notes = $1, discrepancy_reason = NULL, verified_by = $2, verified_at = NOW()
           WHERE validation_item_id = $3`,
          [itemNotes, session?.userId ?? null, itemId]
        );
      } else {
        const { discrepancy_reason } = data;
        await client.query(
          `UPDATE inventory_validation_items
           SET actual_quantity = 0, status = 'not_found', notes = $1,
               discrepancy_reason = $2, verified_by = $3, verified_at = NOW()
           WHERE validation_item_id = $4`,
          [itemNotes, discrepancy_reason || null, session?.userId ?? null, itemId]
        );
      }

      await client.query("COMMIT");

      await logAudit(session?.userId ?? null, "update", "inventory_validation_item", itemId, {
        action: "remove_from_area",
        outcome,
        inventory_id: item.inventory_id,
        destination_area_id: outcome === "moved" ? Number(data.destination_area_id) : undefined,
      });

      // Misma forma que los ítems del GET de la validación.
      const joinedResult = await client.query(
        `SELECT
          vi.*,
          p.name as product_name,
          i.batch_number,
          i.expiry_date
        FROM inventory_validation_items vi
        LEFT JOIN inventory i ON vi.inventory_id = i.inventory_id
        LEFT JOIN products p ON i.product_id = p.product_id
        WHERE vi.validation_item_id = $1`,
        [itemId]
      );

      return NextResponse.json(joinedResult.rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error removing validation item from area:", error);
    return NextResponse.json(
      { error: "Error al marcar el ítem como fuera del área" },
      { status: 500 }
    );
  }
}
