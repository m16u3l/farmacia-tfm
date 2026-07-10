-- =============================================================================
-- BioFarm — Script de creación de base de datos (PostgreSQL)
-- =============================================================================
-- Este script crea el esquema completo utilizado por la aplicación (todas las
-- rutas en src/app/api/*), incluyendo autenticación con roles y bitácora de
-- cambios. Para cargar el inventario real, ejecuta después:
--   db/seed_data_inventario.sql   (productos + lotes desde el Excel real)
--
-- Cómo ejecutarlo:
--   psql "postgresql://usuario:password@host:puerto/basededatos" -f schema.sql
-- =============================================================================

BEGIN;

-- pgcrypto: usado para generar los hashes de contraseña de los usuarios semilla
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- Limpieza (opcional). Descomenta si quieres reiniciar la base desde cero.
-- -----------------------------------------------------------------------------
-- DROP TABLE IF EXISTS audit_log, sell_items, sells, order_items, orders,
--   inventory, products, suppliers, employees, users, configuracion CASCADE;

-- -----------------------------------------------------------------------------
-- 1. users — cuentas con acceso al sistema (login + roles)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id             SERIAL PRIMARY KEY,
  first_name     VARCHAR(100) NOT NULL,
  last_name      VARCHAR(100) NOT NULL,
  email          VARCHAR(150) NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  -- admin: acceso total. farmaceutico: operación diaria (productos, inventario,
  -- ventas, órdenes, proveedores, reportes). cajero: solo ventas e inventario (lectura).
  role           VARCHAR(20) NOT NULL DEFAULT 'cajero'
                 CHECK (role IN ('admin', 'farmaceutico', 'cajero')),
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  employee_id    INTEGER,  -- FK agregada más abajo, luego de crear "employees"
  created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. products — catálogo de medicamentos y artículos
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  product_id            SERIAL PRIMARY KEY,
  name                  VARCHAR(150) NOT NULL,
  description           TEXT,
  -- category: analgésicos | antibióticos | antiinflamatorios | antipiréticos |
  --           cardiovasculares | dermatológicos | gastrointestinales |
  --           respiratorios | vitaminas | otros  (nulo = pendiente de clasificar)
  category              VARCHAR(50),
  -- type: medicamento | suplemento | material médico | cosmético | higiene | otros
  type                  VARCHAR(50),
  -- dosage_form: tableta | cápsula | jarabe | ampolla | crema | ungüento |
  --              suspensión | polvo | gotas | spray | sobre | óvulo | otro
  dosage_form           VARCHAR(50),
  -- unit: unidad | caja | frasco | ampolla | tubo | sobre | blíster | rollo
  unit                  VARCHAR(30),
  -- Instrucción de dosificación libre (ej. "cada 12 horas, adultos")
  dosage_instructions   TEXT,
  barcode               VARCHAR(50) UNIQUE,
  status                BOOLEAN NOT NULL DEFAULT TRUE,
  created_by            INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at            TIMESTAMP NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. suppliers — proveedores
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS suppliers (
  supplier_id   SERIAL PRIMARY KEY,
  name          VARCHAR(150) NOT NULL,
  contact_name  VARCHAR(150),
  phone         VARCHAR(30),
  email         VARCHAR(150) UNIQUE,
  address       TEXT,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 4. inventory_areas — ubicaciones físicas del inventario (sucursal, almacén,
--    estante, etc.), jerárquicas vía parent_area_id
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_areas (
  area_id        SERIAL PRIMARY KEY,
  name           VARCHAR(100) NOT NULL,
  type           VARCHAR(20) NOT NULL DEFAULT 'otro'
                 CHECK (type IN ('sucursal', 'almacen', 'estante', 'otro')),
  -- RESTRICT: no se puede borrar un área mientras tenga sub-áreas (evita huérfanos
  -- silenciosos). Los ciclos (un área como su propio ancestro) se validan en la API,
  -- Postgres no lo puede verificar solo con una FK/CHECK.
  parent_area_id INTEGER REFERENCES inventory_areas(area_id) ON DELETE RESTRICT,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_areas_parent_area_id ON inventory_areas(parent_area_id);

-- -----------------------------------------------------------------------------
-- 5. inventory — lotes de existencias, vinculados a products
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory (
  inventory_id           SERIAL PRIMARY KEY,
  product_id              INTEGER NOT NULL REFERENCES products(product_id) ON DELETE RESTRICT,
  batch_number             VARCHAR(50),
  expiry_date               DATE,
  -- TRUE cuando el vencimiento se aproximó (ej. solo se conocía el año) y
  -- conviene confirmarlo con el proveedor o el empaque físico.
  expiry_is_approximate    BOOLEAN NOT NULL DEFAULT FALSE,
  quantity_available       INTEGER NOT NULL DEFAULT 0 CHECK (quantity_available >= 0),
  -- SET NULL (no RESTRICT): borrar un área no debe bloquearse solo por stock
  -- histórico; la API bloquea el DELETE de áreas con inventario activo antes
  -- de llegar a este punto.
  area_id                   INTEGER REFERENCES inventory_areas(area_id) ON DELETE SET NULL,
  purchase_price            NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (purchase_price >= 0),
  sale_price                NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (sale_price >= 0),
  created_by                INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at                TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_expiry_date ON inventory(expiry_date);
CREATE INDEX IF NOT EXISTS idx_inventory_area_id ON inventory(area_id);

-- -----------------------------------------------------------------------------
-- 6. employees — personal de la farmacia (ficha de RR.HH., no necesariamente
--    tiene acceso al sistema; para eso ver "users")
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employees (
  employee_id  SERIAL PRIMARY KEY,
  first_name   VARCHAR(100) NOT NULL,
  last_name    VARCHAR(100) NOT NULL,
  email        VARCHAR(150) UNIQUE,
  phone        VARCHAR(30),
  role         VARCHAR(50),
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE users
  ADD CONSTRAINT fk_users_employee
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- 7. orders + order_items — órdenes de compra a proveedores
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  order_id      SERIAL PRIMARY KEY,
  supplier_id   INTEGER NOT NULL REFERENCES suppliers(supplier_id) ON DELETE RESTRICT,
  order_date    TIMESTAMP NOT NULL DEFAULT NOW(),
  status        VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                CHECK (status IN ('pendiente', 'aprobado', 'recibido', 'cancelado')),
  total_amount  NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  created_by    INTEGER REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  order_item_id  SERIAL PRIMARY KEY,
  order_id       INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  product_id     INTEGER NOT NULL REFERENCES products(product_id) ON DELETE RESTRICT,
  quantity       INTEGER NOT NULL CHECK (quantity > 0),
  unit_price     NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0)
);

CREATE INDEX IF NOT EXISTS idx_orders_supplier_id ON orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- -----------------------------------------------------------------------------
-- 8. sells + sell_items — ventas al público
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sells (
  sell_id         SERIAL PRIMARY KEY,
  -- Usuario del sistema que registró la venta (quien vendió, y auditoría / trazabilidad)
  user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  sell_date       TIMESTAMP NOT NULL DEFAULT NOW(),
  total_amount    NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  payment_method  VARCHAR(20) NOT NULL DEFAULT 'efectivo'
                  CHECK (payment_method IN ('efectivo', 'qr_transferencia'))
);

CREATE TABLE IF NOT EXISTS sell_items (
  sell_item_id  SERIAL PRIMARY KEY,
  sell_id       INTEGER NOT NULL REFERENCES sells(sell_id) ON DELETE CASCADE,
  inventory_id  INTEGER NOT NULL REFERENCES inventory(inventory_id) ON DELETE RESTRICT,
  quantity      INTEGER NOT NULL CHECK (quantity > 0),
  unit_price    NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  subtotal      NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0)
);

CREATE INDEX IF NOT EXISTS idx_sells_sell_date ON sells(sell_date);
CREATE INDEX IF NOT EXISTS idx_sell_items_sell_id ON sell_items(sell_id);
CREATE INDEX IF NOT EXISTS idx_sell_items_inventory_id ON sell_items(inventory_id);

-- -----------------------------------------------------------------------------
-- 9. configuracion — parámetros generales del sistema (vista /configuracion)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS configuracion (
  id                          SERIAL PRIMARY KEY,
  dias_notificacion_cobranza  INTEGER NOT NULL DEFAULT 5,
  updated_at                  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 10. audit_log — bitácora de cambios (quién hizo qué y cuándo)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action       VARCHAR(10) NOT NULL CHECK (action IN ('create', 'update', 'delete', 'login')),
  entity_type  VARCHAR(50) NOT NULL,   -- 'product' | 'inventory' | 'sell' | 'order' | ...
  entity_id    INTEGER,
  details      JSONB,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- -----------------------------------------------------------------------------
-- 11. inventory_movements — historial de transferencias de inventario entre áreas
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_movements (
  movement_id               SERIAL PRIMARY KEY,
  -- SET NULL: un movimiento histórico sigue siendo válido como bitácora aunque
  -- la fila de inventario puntual ya no exista (p.ej. se vendió/eliminó después).
  source_inventory_id       INTEGER REFERENCES inventory(inventory_id) ON DELETE SET NULL,
  destination_inventory_id  INTEGER REFERENCES inventory(inventory_id) ON DELETE SET NULL,
  -- Se denormalizan las áreas de origen/destino para que el historial siga
  -- siendo legible aunque las filas de inventory referenciadas cambien después.
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

-- -----------------------------------------------------------------------------
-- 12. inventory_validations + inventory_validation_items — sesiones de
--     auditoría de inventario (por área, próximos a vencer, vencidos, bajo stock)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_validations (
  validation_id  SERIAL PRIMARY KEY,
  -- area: cuenta física de un área/ubicación puntual (area_id obligatorio).
  -- expiring / expired / low_stock: snapshot por filtro, no por área.
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
  -- SET NULL: el ítem de validación es un registro histórico de auditoría;
  -- sobrevive aunque el lote de inventario referenciado se elimine después.
  inventory_id         INTEGER REFERENCES inventory(inventory_id) ON DELETE SET NULL,
  -- Snapshot de la cantidad esperada al iniciar la sesión — no se recalcula si
  -- inventory.quantity_available cambia después (venta, transferencia, etc.).
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

-- =============================================================================
-- DATOS INICIALES MÍNIMOS (no es data de ejemplo de negocio — son requisitos
-- para que el sistema arranque: configuración y cuentas de acceso)
-- =============================================================================
BEGIN;

INSERT INTO configuracion (dias_notificacion_cobranza) VALUES (5)
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- Usuarios iniciales — UNA CUENTA POR ROL, para que puedas entrar por primera
-- vez y luego crear las cuentas reales de tu equipo desde /users.
-- Contraseña temporal para las 3 cuentas: "biofarm2026"  (¡cámbiala al entrar!)
-- -----------------------------------------------------------------------------
INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES
  ('Admin', 'BioFarm', 'admin@biofarm.bo', crypt('biofarm2026', gen_salt('bf')), 'admin'),
  ('Farmacéutico', 'BioFarm', 'farmacia@biofarm.bo', crypt('biofarm2026', gen_salt('bf')), 'farmaceutico'),
  ('Cajero', 'BioFarm', 'caja@biofarm.bo', crypt('biofarm2026', gen_salt('bf')), 'cajero')
ON CONFLICT (email) DO NOTHING;

COMMIT;
