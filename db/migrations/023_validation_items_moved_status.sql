-- =============================================================================
-- Migración 023 — Estado 'moved' en ítems de validación de inventario
-- =============================================================================
-- Permite marcar, durante una validación, que un producto ya no está en el
-- área/ubicación contada porque fue movido a otra área. Al marcarlo, el lote
-- se reubica de inmediato (UPDATE inventory.area_id + rastro en
-- inventory_movements con reason 'reubicacion') y el ítem queda 'moved':
-- no representa una discrepancia de cantidad, así que apply-adjustments y la
-- definición de discrepancia de cobertura lo excluyen (igual que 'added').
--
-- El caso "ya no existe en el inventario" no requiere estado nuevo: se marca
-- 'not_found' (actual_quantity = 0) y el ajuste posterior deja el lote en 0.
--
-- Ejecutar:
--   psql "$DB_CONNECTION" -f db/migrations/023_validation_items_moved_status.sql
-- =============================================================================

BEGIN;

ALTER TABLE inventory_validation_items
  DROP CONSTRAINT IF EXISTS inventory_validation_items_status_check;

ALTER TABLE inventory_validation_items
  ADD CONSTRAINT inventory_validation_items_status_check
  CHECK (status IN ('pending', 'confirmed', 'inconsistent', 'not_found', 'added', 'moved'));

COMMIT;
