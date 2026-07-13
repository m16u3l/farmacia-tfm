-- =============================================================================
-- Migración 021 — Área "Por clasificar" + saneamiento de lotes sin ubicación
-- =============================================================================
-- Los lotes de inventory con area_id NULL son invisibles para las validaciones
-- por área y para el estado de cobertura (que parte de inventory_areas), por lo
-- que nunca se cuentan físicamente. Esta migración:
--   1. Crea el área "Por clasificar" (tipo 'otro') si no existe.
--   2. Reasigna a ella todos los lotes sin área.
-- A partir de aquí la API exige area_id al crear/editar inventario, así que no
-- deberían volver a aparecer lotes huérfanos. El área queda visible en la
-- pestaña Estado como pendiente de validar hasta que se reubique su contenido.
--
-- Ejecutar:
--   psql "$DB_CONNECTION" -f db/migrations/021_area_por_clasificar.sql
-- =============================================================================

BEGIN;

INSERT INTO inventory_areas (name, type, parent_area_id)
SELECT 'Por clasificar', 'otro', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM inventory_areas
  WHERE name = 'Por clasificar' AND parent_area_id IS NULL
);

UPDATE inventory
SET area_id = (
  SELECT area_id FROM inventory_areas
  WHERE name = 'Por clasificar' AND parent_area_id IS NULL
  LIMIT 1
)
WHERE area_id IS NULL;

COMMIT;
