import { NextResponse } from "next/server";
import { pool } from "@/config/db";
import { corsHeaders } from "@/lib/cors";
import { getConfiguracionThresholds } from "@/lib/configuracion";
import {
  AreaCoverage,
  AreaCoverageStatus,
  ValidationCoverage,
} from "@/types/validation";

// Una validación de área "cuenta" (está conciliada) cuando se completó y, o
// bien no dejó discrepancias, o bien sus ajustes ya se aplicaron al
// inventario. Misma definición de discrepancia que apply-adjustments.
// Una fecha de vencimiento solo es discrepancia si difiere de la del lote: el
// diálogo de verificación la prellena con la del sistema y la guarda tal cual
// cuando el conteo sale correcto.
const DISCREPANCY_EXISTS = `EXISTS (
  SELECT 1 FROM inventory_validation_items vi
  LEFT JOIN inventory i ON i.inventory_id = vi.inventory_id
  WHERE vi.validation_id = v.validation_id
    AND (vi.status IN ('inconsistent', 'not_found')
         OR (vi.actual_expiry_date IS NOT NULL AND vi.actual_expiry_date IS DISTINCT FROM i.expiry_date))
)`;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Medianoche local de la fecha dada, para comparar días completos.
function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const { validation_due_day } = await getConfiguracionThresholds(client);

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
        -- Última validación conciliada del área (de cualquier fecha; si cae o
        -- no dentro del mes en curso se evalúa después).
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

      // Ciclo mensual: el conteo se hace en los primeros días de cada mes, con
      // plazo hasta validation_due_day. Todo se evalúa contra el mes en curso.
      const now = new Date();
      const today = startOfDay(now);
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const dueDate = new Date(now.getFullYear(), now.getMonth(), validation_due_day);
      const daysUntilDue = Math.round((dueDate.getTime() - today.getTime()) / MS_PER_DAY);

      const areas: AreaCoverage[] = result.rows.map((row) => {
        const lastValidatedAt: string | null = row.last_validated_at;
        // Clamp a 0: si el reloj de la base va unos segundos por delante del
        // servidor, una validación recién hecha daría "hace -1 día(s)".
        const daysSince = lastValidatedAt
          ? Math.max(0, Math.floor((now.getTime() - new Date(lastValidatedAt).getTime()) / MS_PER_DAY))
          : null;
        const validatedThisPeriod =
          !!lastValidatedAt && new Date(lastValidatedAt).getTime() >= periodStart.getTime();

        let status: AreaCoverageStatus;
        if (row.active_lots === 0) {
          status = "no_stock";
        } else if (validatedThisPeriod) {
          status = "validated";
        } else if (!lastValidatedAt) {
          status = "never";
        } else if (daysUntilDue < 0) {
          status = "overdue";
        } else {
          status = "due_soon";
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
          validated_this_period: validatedThisPeriod,
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
      const validated = required.filter((a) => a.status === "validated");

      const coverage: ValidationCoverage = {
        validation_due_day,
        period_label: periodStart.toLocaleDateString("es-ES", { month: "long", year: "numeric" }),
        days_until_due: daysUntilDue,
        total_areas: required.length,
        validated_areas: validated.length,
        coverage_percent:
          required.length === 0 ? 100 : Math.floor((validated.length / required.length) * 100),
        fully_validated: required.length > 0 && validated.length === required.length,
        areas,
      };

      return NextResponse.json(coverage, { headers: corsHeaders });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching inventory validation coverage:", error);
    return NextResponse.json(
      { error: "Error al obtener el estado de validación del inventario" },
      { status: 500, headers: corsHeaders }
    );
  }
}
