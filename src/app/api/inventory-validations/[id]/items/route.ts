import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/config/db";
import { getSessionFromRequest } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

// Agrega un ítem a una validación de área en progreso, para productos
// encontrados físicamente que no estaban en el snapshot inicial:
//   mode 'link':   un lote ya registrado (en otra área o creado después de
//                  iniciar la sesión). Si está en otra área se reubica al área
//                  validada (con su movimiento en inventory_movements) y entra
//                  como ítem 'pending' para contarse normalmente.
//   mode 'create': un lote que no existe en el sistema. Se crea en el área
//                  validada con la cantidad contada y entra como ítem 'added'
//                  (expected 0 / actual contado) — no requiere ajuste posterior
//                  porque el lote ya nace con la cantidad real.
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const validationId = Number(params.id);

  try {
    const data = await request.json();
    const { mode, notes } = data;

    if (mode !== "link" && mode !== "create") {
      return NextResponse.json(
        { error: "Modo inválido: debe ser 'link' o 'create'" },
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
      const validation = validationResult.rows[0];

      if (validation.status !== "in_progress") {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "Solo se pueden agregar ítems a una validación en progreso" },
          { status: 409 }
        );
      }
      if (validation.type !== "area" || !validation.area_id) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "Solo se pueden agregar ítems a una validación por área" },
          { status: 409 }
        );
      }

      let inventoryId: number;
      let insertedItem;

      if (mode === "link") {
        const { inventory_id } = data;
        if (!inventory_id) {
          await client.query("ROLLBACK");
          return NextResponse.json(
            { error: "El lote de inventario es obligatorio" },
            { status: 400 }
          );
        }

        const lotResult = await client.query(
          `SELECT * FROM inventory WHERE inventory_id = $1 FOR UPDATE`,
          [inventory_id]
        );
        if (lotResult.rows.length === 0) {
          await client.query("ROLLBACK");
          return NextResponse.json(
            { error: "Lote de inventario no encontrado" },
            { status: 404 }
          );
        }
        const lot = lotResult.rows[0];

        const existingItem = await client.query(
          `SELECT validation_item_id FROM inventory_validation_items
           WHERE validation_id = $1 AND inventory_id = $2`,
          [validationId, inventory_id]
        );
        if (existingItem.rows.length > 0) {
          await client.query("ROLLBACK");
          return NextResponse.json(
            { error: "Ese lote ya forma parte de esta validación" },
            { status: 409 }
          );
        }

        // El lote está físicamente en el área que se está contando: si el
        // sistema lo tenía en otra, se reubica completo y queda su rastro en
        // inventory_movements (solo si tiene stock — el CHECK exige quantity > 0;
        // un lote en 0 se corrige luego vía conteo + ajustes).
        if (lot.area_id !== validation.area_id) {
          await client.query(
            `UPDATE inventory SET area_id = $1 WHERE inventory_id = $2`,
            [validation.area_id, inventory_id]
          );
          if (lot.quantity_available > 0) {
            await client.query(
              `INSERT INTO inventory_movements (
                source_inventory_id, destination_inventory_id, source_area_id,
                destination_area_id, quantity, reason, notes, moved_by
              ) VALUES ($1, $1, $2, $3, $4, 'reubicacion', $5, $6)`,
              [
                inventory_id,
                lot.area_id,
                validation.area_id,
                lot.quantity_available,
                `Encontrado durante la validación #${validationId}`,
                session?.userId ?? null,
              ]
            );
          }
        }

        const itemResult = await client.query(
          `INSERT INTO inventory_validation_items (validation_id, inventory_id, expected_quantity, notes)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [validationId, inventory_id, lot.quantity_available, notes || null]
        );
        insertedItem = itemResult.rows[0];
        inventoryId = inventory_id;
      } else {
        const {
          product_id,
          batch_number,
          expiry_date,
          quantity_available,
          purchase_price,
          sale_price,
        } = data;

        if (!product_id) {
          await client.query("ROLLBACK");
          return NextResponse.json(
            { error: "El producto es obligatorio" },
            { status: 400 }
          );
        }
        if (!Number.isInteger(quantity_available) || quantity_available <= 0) {
          await client.query("ROLLBACK");
          return NextResponse.json(
            { error: "La cantidad contada debe ser un entero mayor a 0" },
            { status: 400 }
          );
        }

        const productResult = await client.query(
          `SELECT product_id FROM products WHERE product_id = $1`,
          [product_id]
        );
        if (productResult.rows.length === 0) {
          await client.query("ROLLBACK");
          return NextResponse.json(
            { error: "Producto no encontrado" },
            { status: 404 }
          );
        }

        const lotResult = await client.query(
          `INSERT INTO inventory (
            product_id, batch_number, expiry_date, quantity_available,
            area_id, purchase_price, sale_price, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING inventory_id`,
          [
            product_id,
            batch_number || null,
            expiry_date || null,
            quantity_available,
            validation.area_id,
            purchase_price ?? 0,
            sale_price ?? 0,
            session?.userId ?? null,
          ]
        );
        inventoryId = lotResult.rows[0].inventory_id;

        const itemResult = await client.query(
          `INSERT INTO inventory_validation_items (
            validation_id, inventory_id, expected_quantity, actual_quantity,
            status, notes, verified_by, verified_at
          ) VALUES ($1, $2, 0, $3, 'added', $4, $5, NOW())
          RETURNING *`,
          [validationId, inventoryId, quantity_available, notes || null, session?.userId ?? null]
        );
        insertedItem = itemResult.rows[0];
      }

      await client.query("COMMIT");

      await logAudit(session?.userId ?? null, "update", "inventory_validation", validationId, {
        action: "add_item",
        mode,
        inventory_id: inventoryId,
        validation_item_id: insertedItem.validation_item_id,
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
        [insertedItem.validation_item_id]
      );

      return NextResponse.json(joinedResult.rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error adding validation item:", error);
    return NextResponse.json(
      { error: "Error al agregar el ítem a la validación" },
      { status: 500 }
    );
  }
}
