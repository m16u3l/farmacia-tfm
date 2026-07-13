import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/config/db";
import { getSessionFromRequest } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    const result = await pool.query(
      "SELECT * FROM configuracion ORDER BY id LIMIT 1"
    );
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "No hay configuración registrada" },
        { status: 404 }
      );
    }
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener la configuración:", error);
    return NextResponse.json(
      { error: "Error al obtener la configuración" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { low_stock_threshold, expiry_alert_days, validation_period_days } = await request.json();

    if (
      !Number.isInteger(low_stock_threshold) ||
      low_stock_threshold < 0 ||
      !Number.isInteger(expiry_alert_days) ||
      expiry_alert_days < 0
    ) {
      return NextResponse.json(
        { error: "Los parámetros deben ser números enteros mayores o iguales a 0" },
        { status: 400 }
      );
    }
    if (!Number.isInteger(validation_period_days) || validation_period_days < 1) {
      return NextResponse.json(
        { error: "La vigencia de validación debe ser un número entero mayor o igual a 1" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE configuracion
       SET low_stock_threshold = $1, expiry_alert_days = $2, validation_period_days = $3, updated_at = NOW()
       WHERE id = (SELECT id FROM configuracion ORDER BY id LIMIT 1)
       RETURNING *`,
      [low_stock_threshold, expiry_alert_days, validation_period_days]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "No hay configuración registrada" },
        { status: 404 }
      );
    }

    const session = await getSessionFromRequest(request);
    await logAudit(session?.userId ?? null, "update", "configuracion", result.rows[0].id, {
      low_stock_threshold,
      expiry_alert_days,
      validation_period_days,
    });

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error al guardar la configuración:", error);
    return NextResponse.json(
      { error: "Error al guardar la configuración" },
      { status: 500 }
    );
  }
}
