-- =============================================================================
-- Migración 025 — Posición y tamaño de las áreas en el "Mapa de almacén"
-- =============================================================================
-- La página /areas incorpora una pestaña "Mapa": las áreas se dibujan como
-- tarjetas que se arrastran y redimensionan sobre una cuadrícula de 12
-- columnas, formando un plano aproximado del almacén.
--
-- Las coordenadas son RELATIVAS AL ÁREA PADRE: el mapa dibuja siempre un solo
-- nivel (los hijos de un contenedor) y los nietos se muestran en miniatura
-- dentro de la tarjeta. Gracias a eso, mover un área a otro padre no invalida
-- las coordenadas de su subárbol.
--
-- Idempotencia: las columnas se agregan nullable, se rellenan solo donde son
-- NULL y recién después se marcan NOT NULL. Reejecutar no reposiciona nada.
--
-- Ejecutar:
--   db/scripts/migrate.sh "$DB_CONNECTION" 025
-- =============================================================================

BEGIN;

ALTER TABLE inventory_areas ADD COLUMN IF NOT EXISTS map_x SMALLINT;
ALTER TABLE inventory_areas ADD COLUMN IF NOT EXISTS map_y SMALLINT;
ALTER TABLE inventory_areas ADD COLUMN IF NOT EXISTS map_w SMALLINT;
ALTER TABLE inventory_areas ADD COLUMN IF NOT EXISTS map_h SMALLINT;

-- Backfill determinista: dentro de cada nivel, tarjetas de 3x4 en filas de 4.
-- "Por clasificar" (migración 021) va al final de su nivel para no ocupar la
-- esquina superior izquierda del mapa.
WITH ordenadas AS (
  SELECT
    area_id,
    ROW_NUMBER() OVER (
      PARTITION BY COALESCE(parent_area_id, 0)
      ORDER BY (name = 'Por clasificar'), name, area_id
    ) - 1 AS rn
  FROM inventory_areas
  WHERE map_x IS NULL OR map_y IS NULL OR map_w IS NULL OR map_h IS NULL
)
UPDATE inventory_areas a
SET map_x = (o.rn % 4) * 3,
    map_y = (o.rn / 4) * 4,
    map_w = 3,
    map_h = 4
FROM ordenadas o
WHERE a.area_id = o.area_id;

ALTER TABLE inventory_areas ALTER COLUMN map_x SET NOT NULL;
ALTER TABLE inventory_areas ALTER COLUMN map_y SET NOT NULL;
ALTER TABLE inventory_areas ALTER COLUMN map_w SET NOT NULL;
ALTER TABLE inventory_areas ALTER COLUMN map_h SET NOT NULL;

ALTER TABLE inventory_areas ALTER COLUMN map_x SET DEFAULT 0;
ALTER TABLE inventory_areas ALTER COLUMN map_y SET DEFAULT 0;
ALTER TABLE inventory_areas ALTER COLUMN map_w SET DEFAULT 3;
ALTER TABLE inventory_areas ALTER COLUMN map_h SET DEFAULT 4;

-- La API ya valida rangos, pero el CHECK protege contra escrituras directas y
-- contra un bug del endpoint de layout. 12 columnas es la constante del mapa
-- (MAP_COLS en src/utils/areaMap.ts); 200 filas es un tope de cordura.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inventory_areas_map_bounds_chk'
  ) THEN
    ALTER TABLE inventory_areas
      ADD CONSTRAINT inventory_areas_map_bounds_chk CHECK (
        map_x >= 0 AND map_y >= 0
        AND map_w BETWEEN 1 AND 12
        AND map_h BETWEEN 1 AND 48
        AND map_x + map_w <= 12
        AND map_y + map_h <= 200
      );
  END IF;
END $$;

COMMIT;
