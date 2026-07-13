import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/config/db";
import { getSessionFromRequest } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { corsHeaders } from "@/lib/cors";

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    // admin ve todas las ventas; los demás roles solo ven las que ellos registraron
    const isAdmin = session?.role === "admin";
    const client = await pool.connect();
    try {
      const result = await client.query(
        `
        SELECT
          s.*,
          u.first_name || ' ' || u.last_name as user_name,
          json_agg(
            json_build_object(
              'sell_item_id', si.sell_item_id,
              'inventory_id', si.inventory_id,
              'quantity', si.quantity,
              'unit_price', si.unit_price,
              'subtotal', si.subtotal,
              'inventory', json_build_object(
                'inventory_id', i.inventory_id,
                'product_name', p.name,
                'product_id', i.product_id
              )
            )
          ) FILTER (WHERE si.sell_item_id IS NOT NULL) as items
        FROM sells s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN sell_items si ON s.sell_id = si.sell_id
        LEFT JOIN inventory i ON si.inventory_id = i.inventory_id
        LEFT JOIN products p ON i.product_id = p.product_id
        ${isAdmin ? "" : "WHERE s.user_id = $1"}
        GROUP BY s.sell_id, u.first_name, u.last_name
        ORDER BY s.sell_date DESC
      `,
        isAdmin ? [] : [session?.userId ?? null]
      );
      if (!result.rows) {
        return NextResponse.json([], { headers: corsHeaders });
      }
      return NextResponse.json(result.rows, { headers: corsHeaders });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching sells:", error);
    return NextResponse.json(
      { error: "Error al obtener las ventas" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { payment_method, items, fefo_confirmed } = data;
    const session = await getSessionFromRequest(request);
    const client = await pool.connect();

    try {
      // Iniciar transacción
      await client.query('BEGIN');

      // Insertar la venta
      const sellResult = await client.query(
        `INSERT INTO sells (user_id, payment_method, sell_date)
         VALUES ($1, $2, NOW()) RETURNING sell_id`,
        [session?.userId ?? null, payment_method]
      );

      const sellId = sellResult.rows[0].sell_id;

      // Insertar los items de la venta
      for (const item of items) {
        // Lock de la fila de inventario antes de leer/descontar: evita que dos
        // ventas concurrentes del mismo lote lean el mismo stock disponible y
        // lo dejen negativo (antes solo lo frenaba el CHECK >= 0 de Postgres,
        // con un error genérico en vez de "stock insuficiente").
        const invResult = await client.query(
          `SELECT i.quantity_available, i.expiry_date, i.purchase_price, i.product_id, p.name AS product_name
           FROM inventory i
           JOIN products p ON p.product_id = i.product_id
           WHERE i.inventory_id = $1 FOR UPDATE OF i`,
          [item.inventory_id]
        );

        if (invResult.rows.length === 0) {
          throw Object.assign(new Error("Uno de los lotes ya no existe en el inventario"), {
            statusCode: 404,
          });
        }

        const { quantity_available, expiry_date, purchase_price, product_id, product_name } =
          invResult.rows[0];

        if (expiry_date && new Date(expiry_date) < new Date()) {
          throw Object.assign(
            new Error("No se puede vender un lote vencido (revise Validación de Inventario)"),
            { statusCode: 409 }
          );
        }

        if (quantity_available < item.quantity) {
          throw Object.assign(
            new Error(`Stock insuficiente: solo quedan ${quantity_available} unidades disponibles`),
            { statusCode: 409 }
          );
        }

        // Regla FEFO: si existe otro lote del mismo producto, con stock y sin
        // vencer, que vence antes que el elegido, la venta se rechaza salvo
        // confirmación explícita del cajero (fefo_confirmed). Los lotes que ya
        // vienen en el mismo carrito no cuentan como "pendientes de agotar".
        if (!fefo_confirmed) {
          const cartInventoryIds = (items as { inventory_id: number }[]).map(
            (i) => i.inventory_id
          );
          const earlierLot = await client.query(
            `SELECT i2.batch_number, i2.expiry_date
             FROM inventory i2
             WHERE i2.product_id = $1
               AND i2.inventory_id <> ALL($2::int[])
               AND i2.quantity_available > 0
               AND i2.expiry_date IS NOT NULL
               AND i2.expiry_date >= CURRENT_DATE
               AND ($3::date IS NULL OR i2.expiry_date < $3::date)
             ORDER BY i2.expiry_date
             LIMIT 1`,
            [product_id, cartInventoryIds, expiry_date]
          );
          if (earlierLot.rows.length > 0) {
            const lot = earlierLot.rows[0];
            throw Object.assign(
              new Error(
                `FEFO: de "${product_name}" existe otro lote${lot.batch_number ? ` (${lot.batch_number})` : ""} que vence antes y aún tiene stock. Vende ese lote primero, o confirma para continuar con el elegido.`
              ),
              { statusCode: 409, fefoConflict: true }
            );
          }
        }

        // unit_cost congela el precio de compra vigente: la ganancia histórica
        // no debe cambiar si luego se actualiza purchase_price del producto.
        await client.query(
          `INSERT INTO sell_items (sell_id, inventory_id, quantity, unit_price, subtotal, unit_cost)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            sellId,
            item.inventory_id,
            item.quantity,
            item.unit_price,
            item.subtotal,
            purchase_price,
          ]
        );

        // Actualizar el inventario
        await client.query(
          `UPDATE inventory
           SET quantity_available = quantity_available - $1
           WHERE inventory_id = $2`,
          [item.quantity, item.inventory_id]
        );
      }

      // Actualizar el total de la venta
      const total = items.reduce((sum: number, item: { subtotal: number }) => sum + item.subtotal, 0);
      await client.query(
        `UPDATE sells
         SET total_amount = $1
         WHERE sell_id = $2`,
        [total, sellId]
      );

      // Confirmar la transacción
      await client.query('COMMIT');

      await logAudit(session?.userId ?? null, "create", "sell", sellId, {
        total,
        items: items.length,
        ...(fefo_confirmed ? { fefo_override: true } : {}),
      });

      return NextResponse.json({ id: sellId }, { status: 201 });
    } catch (error) {
      // Revertir la transacción en caso de error
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating sell:", error);
    const { statusCode = 500, fefoConflict } = error as {
      statusCode?: number;
      fefoConflict?: boolean;
    };
    return NextResponse.json(
      {
        error: statusCode === 500 ? "Error al crear la venta" : (error as Error).message,
        ...(fefoConflict ? { fefo_conflict: true } : {}),
      },
      { status: statusCode }
    );
  }
}
