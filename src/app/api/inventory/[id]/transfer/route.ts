import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/config/db";
import { getSessionFromRequest } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const sourceId = Number(params.id);

  try {
    const data = await request.json();
    const { destination_area_id, quantity, notes } = data;

    if (!destination_area_id || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: "Área destino y cantidad (mayor a 0) son obligatorios" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const sourceResult = await client.query(
        `SELECT * FROM inventory WHERE inventory_id = $1 FOR UPDATE`,
        [sourceId]
      );

      if (sourceResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "Elemento del inventario no encontrado" },
          { status: 404 }
        );
      }

      const source = sourceResult.rows[0];

      if (destination_area_id === source.area_id) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "El área destino debe ser distinta al área actual" },
          { status: 400 }
        );
      }

      if (quantity > source.quantity_available) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "La cantidad a transferir supera la cantidad disponible" },
          { status: 400 }
        );
      }

      const destinationAreaResult = await client.query(
        `SELECT * FROM inventory_areas WHERE area_id = $1 AND is_active = TRUE`,
        [destination_area_id]
      );
      if (destinationAreaResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "El área destino no existe o no está activa" },
          { status: 400 }
        );
      }

      await client.query(
        `UPDATE inventory SET quantity_available = quantity_available - $1 WHERE inventory_id = $2`,
        [quantity, sourceId]
      );

      const existingDestination = await client.query(
        `SELECT inventory_id FROM inventory
         WHERE product_id = $1 AND area_id = $2
           AND batch_number IS NOT DISTINCT FROM $3
           AND expiry_date IS NOT DISTINCT FROM $4
           AND inventory_id <> $5`,
        [source.product_id, destination_area_id, source.batch_number, source.expiry_date, sourceId]
      );

      let destinationId: number;
      if (existingDestination.rows.length > 0) {
        destinationId = existingDestination.rows[0].inventory_id;
        await client.query(
          `UPDATE inventory SET quantity_available = quantity_available + $1 WHERE inventory_id = $2`,
          [quantity, destinationId]
        );
      } else {
        const inserted = await client.query(
          `INSERT INTO inventory (
            product_id, batch_number, expiry_date, expiry_is_approximate,
            quantity_available, area_id, purchase_price, sale_price, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING inventory_id`,
          [
            source.product_id,
            source.batch_number,
            source.expiry_date,
            source.expiry_is_approximate,
            quantity,
            destination_area_id,
            source.purchase_price,
            source.sale_price,
            source.created_by,
          ]
        );
        destinationId = inserted.rows[0].inventory_id;
      }

      const session = await getSessionFromRequest(request);
      const movement = await client.query(
        `INSERT INTO inventory_movements (
          source_inventory_id, destination_inventory_id, source_area_id,
          destination_area_id, quantity, notes, moved_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [sourceId, destinationId, source.area_id, destination_area_id, quantity, notes || null, session?.userId ?? null]
      );

      await client.query("COMMIT");

      await logAudit(session?.userId ?? null, "update", "inventory", sourceId, {
        action: "transfer",
        destination_area_id,
        quantity,
      });

      return NextResponse.json(movement.rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error transferring inventory item:", error);
    return NextResponse.json(
      { error: "Error al transferir el elemento del inventario" },
      { status: 500 }
    );
  }
}
