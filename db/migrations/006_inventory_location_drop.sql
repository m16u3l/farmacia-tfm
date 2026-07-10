-- =============================================================================
-- Migración 006 — Inventario: eliminar la columna location (texto libre)
-- =============================================================================
-- Paso "contract" de la migración 005. Solo ejecutar DESPUÉS de confirmar que
-- el código desplegado en producción ya lee/escribe area_id en vez de
-- location (backend: src/app/api/inventory/route.ts y [id]/route.ts;
-- frontend: InventoryForm.tsx e inventory/page.tsx). Antes de correr esto,
-- verificar que el backfill de la 005 cubrió todo lo esperado:
--   SELECT count(*) FROM inventory WHERE area_id IS NULL AND location IS NOT NULL;
-- (debería ser 0, o un conjunto ya revisado/aceptado como "sin área asignada")
--
-- Ejecutar:
--   psql "$DB_CONNECTION" -f db/migrations/006_inventory_location_drop.sql
-- =============================================================================

BEGIN;

ALTER TABLE inventory DROP COLUMN IF EXISTS location;

COMMIT;
