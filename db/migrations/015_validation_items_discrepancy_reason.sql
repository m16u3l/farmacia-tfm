-- =============================================================================
-- Migración 015: motivo estructurado de discrepancia en inventory_validation_items
-- =============================================================================
-- Hasta ahora la única forma de registrar por qué una cantidad/vencimiento no
-- coincidía con el sistema era el campo "notes" de texto libre. Para una
-- auditoría sanitaria formal, un motivo estructurado (vencido/dañado/merma/
-- error de conteo) es más defendible que texto libre y permite reportes por
-- causa. "notes" se conserva para detalle adicional en texto libre.
-- Aplicar contra la base existente (no recrea el esquema):
--   psql "$DB_CONNECTION" -f db/migrations/015_validation_items_discrepancy_reason.sql
-- =============================================================================

BEGIN;

ALTER TABLE inventory_validation_items
  ADD COLUMN IF NOT EXISTS discrepancy_reason VARCHAR(20)
    CHECK (discrepancy_reason IN ('vencido', 'dañado', 'merma', 'error_conteo', 'otro'));

COMMIT;
