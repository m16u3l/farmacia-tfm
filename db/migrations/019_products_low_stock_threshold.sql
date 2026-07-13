-- =============================================================================
-- Migración 019 — Umbral de bajo stock por producto
-- =============================================================================
-- Agrega low_stock_threshold a "products": umbral propio del producto para
-- las validaciones de tipo "bajo stock" y el chequeo semanal del cron.
-- NULL (el default) significa "usar el umbral global de configuracion"
-- (configuracion.low_stock_threshold). Un antibiótico de alta rotación puede
-- necesitar avisar a 30 unidades mientras un producto de nicho está bien a 5.
--
-- Ejecutar:
--   psql "$DB_CONNECTION" -f db/migrations/019_products_low_stock_threshold.sql
-- =============================================================================

BEGIN;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER
  CHECK (low_stock_threshold IS NULL OR low_stock_threshold >= 0);

COMMENT ON COLUMN products.low_stock_threshold IS
  'Umbral de bajo stock propio del producto; NULL = usar el global de configuracion';

COMMIT;
