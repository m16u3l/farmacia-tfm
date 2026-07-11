-- =============================================================================
-- Migración 010 — Validaciones de inventario: corrección de fecha de
-- vencimiento durante la verificación física
-- =============================================================================
-- Agrega inventory_validation_items.actual_expiry_date: la fecha real
-- observada en el lote físico al verificarlo (opcional, NULL si no se
-- corrigió). Se aplica a inventory.expiry_date junto con el resto de los
-- ajustes en POST /api/inventory-validations/[id]/apply-adjustments, igual
-- que actual_quantity.
--
-- Additiva/segura de ejecutar en cualquier momento (no toca datos existentes).
--
-- Ejecutar:
--   psql "$DB_CONNECTION" -f db/migrations/010_inventory_validation_items_expiry_date.sql
-- =============================================================================

BEGIN;

ALTER TABLE inventory_validation_items
  ADD COLUMN IF NOT EXISTS actual_expiry_date DATE;

COMMIT;
