-- =============================================================================
-- Migración 027 — Días de alerta de vencimiento por lote
-- =============================================================================
-- Agrega expiry_alert_days a "inventory": días de anticipación propios del lote
-- para la alerta de "próximo a vencer" (validaciones de tipo "expiring" y el
-- chequeo semanal del cron). NULL (el default) significa "usar el valor global
-- de configuracion" (configuracion.expiry_alert_days). Análogo a
-- products.low_stock_threshold (migración 019), pero por lote: un lote de alta
-- rotación puede avisar a 90 días mientras el resto se conforma con 40.
--
-- Ejecutar:
--   psql "$DB_CONNECTION" -f db/migrations/027_inventory_expiry_alert_days.sql
-- =============================================================================

BEGIN;

ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS expiry_alert_days INTEGER
  CHECK (expiry_alert_days IS NULL OR expiry_alert_days >= 0);

COMMENT ON COLUMN inventory.expiry_alert_days IS
  'Días de anticipación para la alerta de vencimiento de este lote; NULL = usar el global de configuracion';

COMMIT;
