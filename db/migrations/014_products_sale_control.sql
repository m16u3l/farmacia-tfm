-- =============================================================================
-- Migración 014: clasificación de venta (libre / receta / controlado) en products
-- =============================================================================
-- El catálogo no distinguía medicamentos de venta libre de los que requieren
-- receta o son de control especial (antibióticos, psicotrópicos) — dato que la
-- mayoría de regulaciones exige registrar por producto.
-- Aplicar contra la base existente (no recrea el esquema):
--   psql "$DB_CONNECTION" -f db/migrations/014_products_sale_control.sql
-- =============================================================================

BEGIN;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sale_control VARCHAR(20) NOT NULL DEFAULT 'libre'
    CHECK (sale_control IN ('libre', 'receta', 'controlado'));

CREATE INDEX IF NOT EXISTS idx_products_sale_control ON products(sale_control);

COMMIT;
