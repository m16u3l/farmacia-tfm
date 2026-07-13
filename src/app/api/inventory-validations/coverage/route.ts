import { NextResponse } from "next/server";
import { pool } from "@/config/db";
import { getConfiguracionThresholds } from "@/lib/configuracion";
import {
  AreaCoverage,
  AreaCoverageStatus,
  ValidationCoverage,
} from "@/types/validation";

// Una validación de área "cuenta" (está conciliada) cuando se completó y, o
// bien no dejó discrepancias, o bien sus ajustes ya se aplicaron al
// inventario. Misma definición de discrepancia que apply-adjustments.
const DISCREPANCY_EXISTS = `EXISTS (
  SELECT 1 FROM inventory_validation_items vi
  WHERE vi.validation_id = v.validation_id
    AND (vi.status IN ('inconsistent', 'not_found') OR vi.actual_expiry_date IS NOT NULL)
)`;

// Días con "aviso previo": un área vigente pasa a "por vencer" cuando le
// quedan estos días o menos de vigencia.
const DUE_SOON_DAYS = 7;

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const { validation_period_days } = await getConfiguracionThresholds(client);

      const result = await client.query(
        `SELECT
          a.area_id,
          a.name,
          a.parent_area_id,
          COALESCE(s.active_lots, 0)::int AS active_lots,
          q.last_validated_at,
          q.last_validation_id,
          q.validated_by_name,
          pa.pending_adjustments_at
        FROM inventory_areas a
        LEFT JOIN (
          SELECT area_id, COUNT(*) FILTER (WHERE quantity_available > 0) AS active_lots
          FROM inventory
          GROUP BY area_id
        ) s ON s.area_id = a.area_id
        -- Última validación conciliada del área (de cualquier fecha; la
        -- vigencia respecto a validation_period_days se evalúa después).
        LEFT JOIN LATERAL (
          SELECT
            v.validation_id AS last_validation_id,
            v.completed_at AS last_validated_at,
            TRIM(CONCAT(u.first_name, ' ', u.last_name)) AS validated_by_name
          FROM inventory_validations v
          LEFT JOIN users u ON u.id = v.started_by
          WHERE v.type = 'area'
            AND v.area_id = a.area_id
            AND v.status = 'completed'
            AND (v.inventory_adjusted_at IS NOT NULL OR NOT ${DISCREPANCY_EXISTS})
          ORDER BY v.completed_at DESC
          LIMIT 1
        ) q ON TRUE
        -- Última validación completada que quedó con discrepancias sin ajustar
        -- (solo interesa si es posterior a la última conciliada).
        LEFT JOIN LATERAL (
          SELECT v.completed_at AS pending_adjustments_at
          FROM inventory_validations v
          WHERE v.type = 'area'
            AND v.area_id = a.area_id
            AND v.status = 'completed'
            AND v.inventory_adjusted_at IS NULL
            AND ${DISCREPANCY_EXISTS}
          ORDER BY v.completed_at DESC
          LIMIT 1
        ) pa ON TRUE
        WHERE a.is_active = TRUE
        ORDER BY a.name`
      );

      const now = Date.now();
      const areas: AreaCoverage[] = result.rows.map((row) => {
        const lastValidatedAt: string | null = row.last_validated_at;
        const daysSince = lastValidatedAt
          ? Math.floor((now - new Date(lastValidatedAt).getTime()) / (1000 * 60 * 60 * 24))
          : null;
        const daysRemaining = daysSince !== null ? validation_period_days - daysSince : null;

        let status: AreaCoverageStatus;
        if (row.active_lots === 0) {
          status = "no_stock";
        } else if (daysRemaining === null) {
          status = "never";
        } else if (daysRemaining <= 0) {
          status = "overdue";
        } else if (daysRemaining <= DUE_SOON_DAYS) {
          status = "due_soon";
        } else {
          status = "validated";
        }

        return {
          area_id: row.area_id,
          name: row.name,
          parent_area_id: row.parent_area_id,
          active_lots: row.active_lots,
          last_validation_id: row.last_validation_id ?? null,
          last_validated_at: lastValidatedAt,
          validated_by_name: row.validated_by_name || null,
          days_since_validated: daysSince,
          days_remaining: daysRemaining,
          has_pending_adjustments:
            !!row.pending_adjustments_at &&
            (!lastValidatedAt ||
              new Date(row.pending_adjustments_at).getTime() > new Date(lastValidatedAt).getTime()),
          status,
        };
      });

      // Solo las áreas con stock activo cuentan para el porcentaje: un área
      // vacía no requiere conteo físico y no debe impedir llegar al 100%.
      const required = areas.filter((a) => a.status !== "no_stock");
      const validated = required.filter((a) => a.status === "validated" || a.status === "due_soon");

      const coverage: ValidationCoverage = {
        validation_period_days,
        total_areas: required.length,
        validated_areas: validated.length,
        coverage_percent:
          required.length === 0 ? 100 : Math.floor((validated.length / required.length) * 100),
        fully_validated: required.length > 0 && validated.length === required.length,
        areas,
      };

      return NextResponse.json(coverage);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching inventory validation coverage:", error);
    return NextResponse.json(
      { error: "Error al obtener el estado de validación del inventario" },
      { status: 500 }
    );
  }
}
