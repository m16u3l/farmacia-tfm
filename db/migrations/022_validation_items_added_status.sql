-- =============================================================================
-- Migración 022 — Estado 'added' en ítems de validación de inventario
-- =============================================================================
-- Permite registrar productos encontrados físicamente durante una validación
-- de área que no estaban en el snapshot inicial. Un ítem 'added' representa un
-- lote creado en ese momento (expected_quantity = 0, actual_quantity = lo
-- contado): el lote de inventario ya nace con la cantidad real, así que estos
-- ítems no requieren ajuste posterior (apply-adjustments y la definición de
-- discrepancia de cobertura los excluyen).
--
-- Ejecutar:
--   psql "$DB_CONNECTION" -f db/migrations/022_validation_items_added_status.sql
-- =============================================================================

BEGIN;

ALTER TABLE inventory_validation_items
  DROP CONSTRAINT IF EXISTS inventory_validation_items_status_check;

ALTER TABLE inventory_validation_items
  ADD CONSTRAINT inventory_validation_items_status_check
  CHECK (status IN ('pending', 'confirmed', 'inconsistent', 'not_found', 'added'));

COMMIT;
