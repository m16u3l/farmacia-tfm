-- =============================================================================
-- Migración 018 — Vigencia de las validaciones de inventario
-- =============================================================================
-- Agrega validation_period_days a "configuracion": cantidad de días durante
-- los cuales una validación de área completada (y conciliada: sin
-- discrepancias, o con sus ajustes ya aplicados al inventario) se considera
-- vigente para el estado de cobertura de /inventory-validations (pestaña
-- "Estado") y el widget del dashboard. Default 30 = ciclo de conteo mensual.
--
-- Ejecutar:
--   psql "$DB_CONNECTION" -f db/migrations/018_configuracion_validation_period.sql
-- =============================================================================

BEGIN;

ALTER TABLE configuracion
  ADD COLUMN IF NOT EXISTS validation_period_days INTEGER NOT NULL DEFAULT 30 CHECK (validation_period_days >= 1);

COMMIT;
