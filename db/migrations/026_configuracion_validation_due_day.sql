-- =============================================================================
-- Migración 026 — La validación de inventario pasa a ciclo por mes calendario
-- =============================================================================
-- Reemplaza validation_period_days (ventana móvil: "vigente N días desde la
-- última validación") por validation_due_day: el día del mes hasta el cual hay
-- plazo para validar cada área. Cada área debe validarse una vez dentro del mes
-- en curso, en los primeros días; pasado el día límite queda vencida.
-- Default 10 = primeros diez días del mes.
--
-- Ejecutar:
--   psql "$DB_CONNECTION" -f db/migrations/026_configuracion_validation_due_day.sql
-- =============================================================================

BEGIN;

ALTER TABLE configuracion
  ADD COLUMN IF NOT EXISTS validation_due_day INTEGER NOT NULL DEFAULT 10 CHECK (validation_due_day BETWEEN 1 AND 28);

ALTER TABLE configuracion
  DROP COLUMN IF EXISTS validation_period_days;

COMMIT;
