-- =============================================================================
-- BioFarm — Script de creación de base de datos (PostgreSQL)
-- =============================================================================
-- Este script crea el esquema completo utilizado por la aplicación (todas las
-- rutas en src/app/api/*) y lo carga con datos de ejemplo realistas para una
-- farmacia en Cochabamba, Bolivia.
--
-- Cómo ejecutarlo:
--   psql "postgresql://usuario:password@host:puerto/basededatos" -f schema.sql
-- o, si usas Supabase local (Docker):
--   supabase db reset   (colocando este archivo en supabase/seed.sql o migrations)
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Limpieza (opcional). Descomenta si quieres reiniciar la base desde cero.
-- -----------------------------------------------------------------------------
-- DROP TABLE IF EXISTS sell_items, sells, order_items, orders, inventory,
--   products, suppliers, employees, users, configuracion CASCADE;

-- -----------------------------------------------------------------------------
-- 1. products — catálogo de medicamentos y artículos
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  product_id   SERIAL PRIMARY KEY,
  name         VARCHAR(150) NOT NULL,
  description  TEXT,
  -- Valores usados por el frontend (ver src/types/products.ts):
  -- category: analgésicos | antibióticos | antiinflamatorios | antipiréticos |
  --           cardiovasculares | dermatológicos | gastrointestinales |
  --           respiratorios | vitaminas | otros
  category     VARCHAR(50),
  -- type: medicamento | suplemento | material médico | cosmético | higiene | otros
  type         VARCHAR(50),
  -- dosage_form: tableta | cápsula | jarabe | ampolla | crema | ungüento |
  --              suspensión | polvo | gotas | spray | otro
  dosage_form  VARCHAR(50),
  -- unit: unidad | caja | frasco | ampolla | tubo | sobre | blíster | botella
  unit         VARCHAR(30),
  barcode      VARCHAR(50) UNIQUE,
  status       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. suppliers — proveedores
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
-- 3. inventory — lotes de existencias, vinculados a products
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory (
  inventory_id        SERIAL PRIMARY KEY,
  product_id           INTEGER NOT NULL REFERENCES products(product_id) ON DELETE RESTRICT,
  batch_number         VARCHAR(50),
  expiry_date          DATE,
  quantity_available   INTEGER NOT NULL DEFAULT 0 CHECK (quantity_available >= 0),
  location             VARCHAR(100),
  purchase_price       NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (purchase_price >= 0),
  sale_price           NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (sale_price >= 0),
  created_at           TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_expiry_date ON inventory(expiry_date);

-- -----------------------------------------------------------------------------
-- 4. employees — personal de la farmacia
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

-- -----------------------------------------------------------------------------
-- 5. users — usuarios con acceso al sistema
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  first_name  VARCHAR(100) NOT NULL,
  last_name   VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 6. orders + order_items — órdenes de compra a proveedores
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  order_id      SERIAL PRIMARY KEY,
  supplier_id   INTEGER NOT NULL REFERENCES suppliers(supplier_id) ON DELETE RESTRICT,
  order_date    TIMESTAMP NOT NULL DEFAULT NOW(),
  status        VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                CHECK (status IN ('pendiente', 'aprobado', 'recibido', 'cancelado')),
  total_amount  NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0)
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
-- 7. sells + sell_items — ventas al público
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sells (
  sell_id         SERIAL PRIMARY KEY,
  customer_name   VARCHAR(150),
  employee_id     INTEGER REFERENCES employees(employee_id) ON DELETE SET NULL,
  sell_date       TIMESTAMP NOT NULL DEFAULT NOW(),
  total_amount    NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  payment_method  VARCHAR(20) NOT NULL DEFAULT 'efectivo'
                  CHECK (payment_method IN ('efectivo', 'tarjeta', 'seguro', 'transferencia'))
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
-- 8. configuracion — parámetros generales del sistema (vista /configuracion)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS configuracion (
  id                          SERIAL PRIMARY KEY,
  dias_notificacion_cobranza  INTEGER NOT NULL DEFAULT 5,
  updated_at                  TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMIT;

-- =============================================================================
-- DATOS DE EJEMPLO
-- =============================================================================
BEGIN;

-- -----------------------------------------------------------------------------
-- Proveedores
-- -----------------------------------------------------------------------------
INSERT INTO suppliers (name, contact_name, phone, email, address) VALUES
  ('Distribuidora Farmacéutica Cochabamba SRL', 'Marcelo Rojas', '4-4231190', 'ventas@dfc-cbba.bo', 'Av. Blanco Galindo km 4, Cochabamba'),
  ('Droguería Valle Alto S.A.', 'Patricia Guzmán', '4-4456712', 'contacto@drogueriavallealto.bo', 'Av. Ayacucho 245, Cochabamba'),
  ('Insumos Médicos Bolivia SRL', 'Jorge Terrazas', '4-4678890', 'pedidos@insumosmedicosbo.com', 'Calle España 512, Cochabamba')
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- Productos
-- -----------------------------------------------------------------------------
INSERT INTO products (name, description, category, type, dosage_form, unit, barcode, status) VALUES
  ('Paracetamol 500mg', 'Analgésico y antipirético de uso general', 'analgésicos', 'medicamento', 'tableta', 'caja', '7800100000011', TRUE),
  ('Ibuprofeno 400mg', 'Antiinflamatorio no esteroideo', 'antiinflamatorios', 'medicamento', 'tableta', 'caja', '7800100000028', TRUE),
  ('Amoxicilina 500mg', 'Antibiótico de amplio espectro', 'antibióticos', 'medicamento', 'cápsula', 'caja', '7800100000035', TRUE),
  ('Diclofenaco 50mg', 'Antiinflamatorio para dolor muscular y articular', 'antiinflamatorios', 'medicamento', 'tableta', 'caja', '7800100000042', TRUE),
  ('Omeprazol 20mg', 'Protector gástrico, inhibidor de bomba de protones', 'gastrointestinales', 'medicamento', 'cápsula', 'caja', '7800100000059', TRUE),
  ('Losartán 50mg', 'Antihipertensivo, antagonista de receptores de angiotensina II', 'cardiovasculares', 'medicamento', 'tableta', 'caja', '7800100000066', TRUE),
  ('Salbutamol Inhalador', 'Broncodilatador para crisis asmáticas', 'respiratorios', 'medicamento', 'spray', 'unidad', '7800100000073', TRUE),
  ('Vitamina C 1000mg', 'Suplemento para reforzar el sistema inmunológico', 'vitaminas', 'suplemento', 'tableta', 'frasco', '7800100000080', TRUE),
  ('Loratadina 10mg', 'Antihistamínico para alergias', 'otros', 'medicamento', 'tableta', 'caja', '7800100000097', TRUE),
  ('Crema Hidratante Corporal', 'Cuidado dermatológico para piel seca', 'dermatológicos', 'cosmético', 'crema', 'tubo', '7800100000103', TRUE),
  ('Suero Oral Hidratante', 'Rehidratación por diarrea o vómitos', 'gastrointestinales', 'medicamento', 'sobre', 'sobre', '7800100000110', TRUE),
  ('Alcohol en Gel 70%', 'Antiséptico para manos', 'otros', 'higiene', 'gotas', 'botella', '7800100000127', TRUE),
  ('Mascarillas Quirúrgicas x50', 'Material médico de bioseguridad', 'otros', 'material médico', 'otro', 'caja', '7800100000134', TRUE),
  ('Jeringas Descartables 5ml', 'Material médico para inyectables', 'otros', 'material médico', 'otro', 'caja', '7800100000141', TRUE),
  ('Jarabe para la Tos', 'Antitusivo de uso pediátrico y adulto', 'respiratorios', 'medicamento', 'jarabe', 'frasco', '7800100000158', TRUE)
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- Inventario (lotes). Precios en Bolivianos (Bs.).
-- Se incluyen lotes próximos a vencer y con stock bajo para probar las alertas.
-- -----------------------------------------------------------------------------
INSERT INTO inventory (product_id, batch_number, expiry_date, quantity_available, location, purchase_price, sale_price) VALUES
  (1, 'LOT-2026-001', '2027-06-30', 320, 'Estante A1', 0.35, 0.80),
  (2, 'LOT-2026-002', '2027-03-15', 210, 'Estante A1', 0.55, 1.20),
  (3, 'LOT-2026-003', '2026-09-10', 8,   'Estante A2', 1.10, 2.50),
  (4, 'LOT-2026-004', '2026-12-01', 150, 'Estante A2', 0.60, 1.30),
  (5, 'LOT-2026-005', '2027-01-20', 95,  'Estante A3', 1.40, 3.00),
  (6, 'LOT-2026-006', '2026-08-05', 6,   'Estante A3', 1.80, 3.90),
  (7, 'LOT-2026-007', '2026-07-25', 14,  'Estante B1', 25.00, 45.00),
  (8, 'LOT-2026-008', '2027-05-10', 60,  'Estante B2', 18.00, 32.00),
  (9, 'LOT-2026-009', '2027-02-18', 180, 'Estante A2', 0.45, 1.00),
  (10, 'LOT-2026-010', '2027-11-30', 40, 'Estante C1', 12.00, 22.00),
  (11, 'LOT-2026-011', '2026-10-15', 200, 'Estante B3', 1.20, 2.50),
  (12, 'LOT-2026-012', '2027-04-22', 75, 'Estante C2', 8.00, 15.00),
  (13, 'LOT-2026-013', '2028-01-01', 30, 'Estante D1', 20.00, 35.00),
  (14, 'LOT-2026-014', '2028-01-01', 100, 'Estante D1', 15.00, 28.00),
  (15, 'LOT-2026-015', '2026-08-30', 45, 'Estante B1', 6.00, 12.00)
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- Empleados
-- -----------------------------------------------------------------------------
INSERT INTO employees (first_name, last_name, email, phone, role) VALUES
  ('Fernanda', 'Camacho Rojas', 'fernanda.camacho@biofarm.bo', '74810111', 'Farmacéutica'),
  ('Rodrigo', 'Vargas Mamani', 'rodrigo.vargas@biofarm.bo', '74810112', 'Auxiliar de farmacia'),
  ('Daniela', 'Quiroga Salazar', 'daniela.quiroga@biofarm.bo', '74810113', 'Cajera')
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- Usuarios del sistema
-- -----------------------------------------------------------------------------
INSERT INTO users (first_name, last_name, email) VALUES
  ('Miguel', 'Administrador', 'admin@biofarm.bo'),
  ('Fernanda', 'Camacho', 'fernanda.camacho@biofarm.bo')
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- Órdenes de compra a proveedores
-- -----------------------------------------------------------------------------
INSERT INTO orders (supplier_id, order_date, status, total_amount) VALUES
  (1, NOW() - INTERVAL '10 days', 'recibido', 1250.00),
  (2, NOW() - INTERVAL '3 days', 'aprobado', 890.50),
  (3, NOW(), 'pendiente', 430.00)
ON CONFLICT DO NOTHING;

INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
  (1, 1, 500, 0.35),
  (1, 2, 300, 0.55),
  (2, 5, 150, 1.40),
  (2, 6, 100, 1.80),
  (3, 7, 20, 25.00),
  (3, 13, 20, 20.00)
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- Ventas de ejemplo
-- -----------------------------------------------------------------------------
INSERT INTO sells (customer_name, employee_id, sell_date, total_amount, payment_method) VALUES
  ('Cliente mostrador', 1, NOW() - INTERVAL '1 day', 4.30, 'efectivo'),
  ('Ana María Fernández', 2, NOW() - INTERVAL '2 hours', 45.00, 'tarjeta'),
  ('Cliente mostrador', 3, NOW(), 12.50, 'efectivo')
ON CONFLICT DO NOTHING;

INSERT INTO sell_items (sell_id, inventory_id, quantity, unit_price, subtotal) VALUES
  (1, 1, 2, 0.80, 1.60),
  (1, 2, 1, 1.20, 1.20),
  (1, 9, 1, 1.00, 1.00),
  (2, 7, 1, 45.00, 45.00),
  (3, 11, 5, 2.50, 12.50)
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- Configuración general
-- -----------------------------------------------------------------------------
INSERT INTO configuracion (dias_notificacion_cobranza) VALUES (5)
ON CONFLICT DO NOTHING;

COMMIT;
