-- =============================================================================
-- Migración 016: órdenes de compra → solicitudes de reposición simples
-- =============================================================================
-- La orden de compra formal (proveedor + cantidades + precios) no reflejaba el
-- flujo real de la farmacia: basta con anotar que falta un producto y hay que
-- comprarlo. La orden pasa a ser una solicitud ligera (productos + nota) con
-- estados pendiente / comprado / descartado. El monto real de la compra se
-- registrará como gasto (ver migración 017) al marcarla como comprada.
-- Las órdenes históricas conservan sus items con cantidades y precios.
-- Aplicar contra la base existente (no recrea el esquema):
--   psql "$DB_CONNECTION" -f db/migrations/016_orders_restock_requests.sql
-- =============================================================================

BEGIN;

-- El proveedor deja de ser obligatorio (las solicitudes nuevas no lo usan).
ALTER TABLE orders ALTER COLUMN supplier_id DROP NOT NULL;

-- Nota libre: "quedan 2 cajas", "pedir genérico", etc.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS note TEXT;

-- Estados simplificados; se remapean los históricos:
--   aprobado → pendiente (seguía sin comprarse), recibido → comprado,
--   cancelado → descartado.
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
UPDATE orders SET status = CASE status
  WHEN 'aprobado' THEN 'pendiente'
  WHEN 'recibido' THEN 'comprado'
  WHEN 'cancelado' THEN 'descartado'
  ELSE status
END;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pendiente', 'comprado', 'descartado'));

-- Los items nuevos solo señalan el producto faltante; cantidad y precio quedan
-- solo en los históricos.
ALTER TABLE order_items ALTER COLUMN quantity DROP NOT NULL;
ALTER TABLE order_items ALTER COLUMN unit_price DROP NOT NULL;

COMMIT;
