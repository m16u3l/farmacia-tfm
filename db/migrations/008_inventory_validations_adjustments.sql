-- =============================================================================
-- Migración 008 — Validaciones de inventario: ajustes al inventario real +
-- bloqueo de sesiones concurrentes duplicadas
-- =============================================================================
-- 1) Agrega inventory_adjusted_at / inventory_adjusted_by a inventory_validations:
--    guarda de idempotencia + auditoría para el nuevo paso explícito "aplicar
--    ajustes al inventario" (POST /api/inventory-validations/[id]/apply-adjustments),
--    separado de "Finalizar" la sesión.
-- 2) Agrega dos índices únicos parciales que impiden crear una nueva sesión
--    'in_progress' del mismo tipo (y, para type='area', la misma área) mientras
--    ya existe una en progreso — a nivel de base de datos, no solo en la app,
--    para que sea a prueba de condiciones de carrera entre conexiones distintas.
--
-- Additiva/segura de ejecutar en cualquier momento (no toca datos existentes).
--
-- Ejecutar:
--   psql "$DB_CONNECTION" -f db/migrations/008_inventory_validations_adjustments.sql
-- =============================================================================

BEGIN;

ALTER TABLE inventory_validations
  ADD COLUMN IF NOT EXISTS inventory_adjusted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS inventory_adjusted_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_inventory_validations_in_progress_area
  ON inventory_validations (type, area_id)
  WHERE status = 'in_progress' AND type = 'area';

CREATE UNIQUE INDEX IF NOT EXISTS uq_inventory_validations_in_progress_global
  ON inventory_validations (type)
  WHERE status = 'in_progress' AND type <> 'area';

COMMIT;
