-- =============================================================================
-- Migración 007 — Inventario: reestructurar áreas "N-L" en estante + apartado
-- =============================================================================
-- Las áreas se venían nombrando como "1-A", "2-A", etc. (número-letra), pero en
-- la práctica la letra es el estante físico y el número es el apartado dentro
-- de ese estante. Esta migración:
--
--   1) Amplía el CHECK de inventory_areas.type para admitir 'apartado'.
--   2) Resuelve un duplicado histórico de "10-B" (una fila type='estante' sin
--      padre y otra type='otro' con el mismo nombre) reasignando su inventario
--      a la fila que se conserva. No-op si ese duplicado no existe (p. ej. en
--      una base que nunca tuvo este artefacto de prueba).
--   3) Crea un área type='estante' por cada letra distinta usada en nombres
--      "N-L" (si no existe ya una con ese nombre).
--   4) Convierte cada área "N-L" en un 'apartado' hijo de su estante,
--      renombrándola a solo "N" (el estante ya da el contexto en el árbol).
--
-- Es additiva/idempotente sobre la jerarquía: no toca inventory.area_id (los
-- IDs de área no cambian, solo su name/type/parent_area_id), así que las
-- referencias existentes en inventory, inventory_movements e
-- inventory_validations siguen siendo válidas sin necesidad de reasignarlas.
-- Áreas que no siguen el patrón "N-L" (p. ej. ubicaciones de texto libre
-- distintas, o datos de prueba como "Sucursal Test") quedan sin tocar.
--
-- Ejecutar:
--   psql "$DB_CONNECTION" -f db/migrations/007_inventory_areas_estante_apartado.sql
-- =============================================================================

BEGIN;

-- 1) Ampliar el CHECK de type para incluir 'apartado'
ALTER TABLE inventory_areas DROP CONSTRAINT IF EXISTS inventory_areas_type_check;
ALTER TABLE inventory_areas ADD CONSTRAINT inventory_areas_type_check
  CHECK (type IN ('sucursal', 'almacen', 'estante', 'otro', 'apartado'));

-- 2) Duplicado histórico de "10-B": si existen dos filas con ese nombre (una
--    'estante' sin padre, creada a mano por error, y otra 'otro' del backfill
--    original), mover el inventario de la primera a la segunda y borrar la
--    primera. No-op si no aplica.
DO $$
DECLARE
  dup_id INTEGER;
  keep_id INTEGER;
BEGIN
  SELECT area_id INTO dup_id
    FROM inventory_areas
   WHERE type = 'estante' AND parent_area_id IS NULL AND name ~ '^[0-9]+-[A-Za-z]+$';

  IF dup_id IS NOT NULL THEN
    SELECT area_id INTO keep_id
      FROM inventory_areas
     WHERE area_id <> dup_id AND type = 'otro'
       AND name = (SELECT name FROM inventory_areas WHERE area_id = dup_id);

    IF keep_id IS NOT NULL THEN
      UPDATE inventory SET area_id = keep_id WHERE area_id = dup_id;
      DELETE FROM inventory_areas WHERE area_id = dup_id;
    END IF;
  END IF;
END $$;

-- 3) Un área 'estante' por cada letra distinta usada en nombres "N-L"
INSERT INTO inventory_areas (name, type, parent_area_id)
SELECT DISTINCT substring(name FROM '^[0-9]+-([A-Za-z]+)$'), 'estante', NULL::INTEGER
FROM inventory_areas
WHERE name ~ '^[0-9]+-[A-Za-z]+$'
  AND substring(name FROM '^[0-9]+-([A-Za-z]+)$') NOT IN (
    SELECT name FROM inventory_areas WHERE type = 'estante' AND parent_area_id IS NULL
  );

-- 4) Convertir cada área "N-L" en un 'apartado' hijo de su estante "L",
--    renombrándola a solo "N"
UPDATE inventory_areas a
SET type = 'apartado',
    parent_area_id = e.area_id,
    name = substring(a.name FROM '^([0-9]+)-[A-Za-z]+$')
FROM inventory_areas e
WHERE a.name ~ '^[0-9]+-[A-Za-z]+$'
  AND e.type = 'estante'
  AND e.parent_area_id IS NULL
  AND e.name = substring(a.name FROM '^[0-9]+-([A-Za-z]+)$');

COMMIT;
