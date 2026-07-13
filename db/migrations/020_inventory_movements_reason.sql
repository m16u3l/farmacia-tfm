-- =============================================================================
-- Migración 020 — Motivo estructurado en transferencias de inventario
-- =============================================================================
-- Agrega "reason" a inventory_movements, análogo al discrepancy_reason de las
-- validaciones (migración 015): para una auditoría sanitaria formal, un motivo
-- estructurado es más defendible que texto libre y permite reportes por causa.
-- "notes" se conserva para detalle adicional. Nullable para los movimientos
-- históricos previos a esta migración.
--
-- Ejecutar:
--   psql "$DB_CONNECTION" -f db/migrations/020_inventory_movements_reason.sql
-- =============================================================================

BEGIN;

ALTER TABLE inventory_movements
  ADD COLUMN IF NOT EXISTS reason VARCHAR(20)
    CHECK (reason IN ('reposicion', 'reubicacion', 'vencido', 'dañado', 'otro'));

COMMIT;
