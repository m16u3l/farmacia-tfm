-- =============================================================================
-- Migración 005 — Inventario: áreas jerárquicas, transferencias y validaciones
-- =============================================================================
-- Paso "expand" de una migración expand/contract: crea las tablas nuevas
-- (inventory_areas, inventory_movements, inventory_validations,
-- inventory_validation_items), agrega inventory.area_id (nullable) y hace
-- backfill de las áreas a partir del actual inventory.location (texto libre),
-- sin tocar ni eliminar la columna location. Segura de ejecutar en cualquier
-- momento, incluso antes de desplegar el código nuevo — el código actual
-- (que todavía usa location) sigue funcionando igual.
--
-- El paso "contract" (eliminar inventory.location) va en la migración 006, y
-- solo debe correrse después de confirmar que el código desplegado en
-- producción ya lee/escribe area_id en vez de location (backend:
-- src/app/api/inventory/route.ts y [id]/route.ts; frontend: InventoryForm.tsx
-- e inventory/page.tsx).
--
-- Ejecutar:
--   psql "$DB_CONNECTION" -f db/migrations/005_inventory_areas_and_validations_expand.sql
-- =============================================================================

BEGIN;

-- 1) inventory_areas — ubicaciones físicas jerárquicas (sucursal/almacén/estante/otro)
CREATE TABLE IF NOT EXISTS inventory_areas (
  area_id        SERIAL PRIMARY KEY,
  name           VARCHAR(100) NOT NULL,
  type           VARCHAR(20) NOT NULL DEFAULT 'otro'
                 CHECK (type IN ('sucursal', 'almacen', 'estante', 'otro')),
  parent_area_id INTEGER REFERENCES inventory_areas(area_id) ON DELETE RESTRICT,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_areas_parent_area_id ON inventory_areas(parent_area_id);

-- 2) inventory.area_id — nullable por ahora, coexiste con location
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS area_id INTEGER REFERENCES inventory_areas(area_id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_area_id ON inventory(area_id);

-- 3) Backfill: una inventory_areas (type='otro') por cada location distinto
--    no vacío, y apuntar las filas de inventory correspondientes a esa área.
--    Filas con location NULL/vacío quedan con area_id NULL ("sin asignar" es
--    un estado válido que la UI debe manejar).
INSERT INTO inventory_areas (name, type)
SELECT DISTINCT btrim(location), 'otro'
FROM inventory
WHERE location IS NOT NULL AND btrim(location) <> ''
  AND btrim(location) NOT IN (SELECT name FROM inventory_areas WHERE type = 'otro');

UPDATE inventory i
SET area_id = a.area_id
FROM inventory_areas a
WHERE a.name = btrim(i.location) AND a.type = 'otro' AND i.area_id IS NULL
  AND i.location IS NOT NULL AND btrim(i.location) <> '';

-- 4) inventory_movements — historial de transferencias entre áreas
CREATE TABLE IF NOT EXISTS inventory_movements (
  movement_id               SERIAL PRIMARY KEY,
  source_inventory_id       INTEGER REFERENCES inventory(inventory_id) ON DELETE SET NULL,
  destination_inventory_id  INTEGER REFERENCES inventory(inventory_id) ON DELETE SET NULL,
  source_area_id            INTEGER REFERENCES inventory_areas(area_id) ON DELETE SET NULL,
  destination_area_id       INTEGER REFERENCES inventory_areas(area_id) ON DELETE SET NULL,
  quantity                  INTEGER NOT NULL CHECK (quantity > 0),
  notes                     TEXT,
  moved_by                  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  moved_at                  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_source_inventory_id ON inventory_movements(source_inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_destination_inventory_id ON inventory_movements(destination_inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_moved_at ON inventory_movements(moved_at);

-- 5) inventory_validations + inventory_validation_items — sesiones de auditoría
--    (por área, próximos a vencer, vencidos, bajo stock)
CREATE TABLE IF NOT EXISTS inventory_validations (
  validation_id  SERIAL PRIMARY KEY,
  type           VARCHAR(20) NOT NULL
                 CHECK (type IN ('area', 'expiring', 'expired', 'low_stock')),
  area_id        INTEGER REFERENCES inventory_areas(area_id) ON DELETE SET NULL,
  status         VARCHAR(20) NOT NULL DEFAULT 'in_progress'
                 CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  notes          TEXT,
  started_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  started_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at   TIMESTAMP,
  CONSTRAINT inventory_validations_area_id_consistency
    CHECK ((type = 'area' AND area_id IS NOT NULL) OR (type <> 'area'))
);

CREATE INDEX IF NOT EXISTS idx_inventory_validations_status ON inventory_validations(status);
CREATE INDEX IF NOT EXISTS idx_inventory_validations_type ON inventory_validations(type);

CREATE TABLE IF NOT EXISTS inventory_validation_items (
  validation_item_id  SERIAL PRIMARY KEY,
  validation_id        INTEGER NOT NULL REFERENCES inventory_validations(validation_id) ON DELETE CASCADE,
  inventory_id         INTEGER REFERENCES inventory(inventory_id) ON DELETE SET NULL,
  expected_quantity    INTEGER NOT NULL,
  actual_quantity      INTEGER,
  status               VARCHAR(20) NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'confirmed', 'inconsistent', 'not_found')),
  notes                TEXT,
  verified_by          INTEGER REFERENCES users(id) ON DELETE SET NULL,
  verified_at          TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_validation_items_validation_id ON inventory_validation_items(validation_id);
CREATE INDEX IF NOT EXISTS idx_inventory_validation_items_inventory_id ON inventory_validation_items(inventory_id);

COMMIT;
