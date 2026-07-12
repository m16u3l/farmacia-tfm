-- =============================================================================
-- Migración 013: campos de identificación del medicamento en products
-- =============================================================================
-- Agrega laboratorio/fabricante, principio activo, concentración y registro
-- sanitario al catálogo de productos, para reducir errores de dispensación
-- (confundir marcas/laboratorios o concentraciones del mismo medicamento).
-- Aplicar contra la base existente (no recrea el esquema):
--   psql "$DB_CONNECTION" -f db/migrations/013_products_identification_fields.sql
-- =============================================================================

BEGIN;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS laboratory VARCHAR(100),
  ADD COLUMN IF NOT EXISTS active_ingredient VARCHAR(150),
  ADD COLUMN IF NOT EXISTS concentration VARCHAR(50),
  ADD COLUMN IF NOT EXISTS health_registry VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_products_active_ingredient ON products(active_ingredient);
CREATE INDEX IF NOT EXISTS idx_products_laboratory ON products(laboratory);

COMMIT;
