-- =============================================================================
-- Migración 017: gastos (expenses) + costo congelado por venta (unit_cost)
-- =============================================================================
-- 1) expenses: gastos administrativos y de compras (vinculables a una solicitud
--    de reposición de la migración 016), para calcular ganancia neta en el
--    reporte mensual: ventas − costo de productos − gastos.
-- 2) sell_items.unit_cost: copia del precio de compra del lote (inventory)
--    al momento de vender, para que la ganancia histórica no cambie si luego
--    se actualiza purchase_price. Las ventas anteriores se rellenan con el
--    precio de compra actual del lote como aproximación.
-- Aplicar contra la base existente (no recrea el esquema):
--   psql "$DB_CONNECTION" -f db/migrations/017_expenses_and_sell_unit_cost.sql
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS expenses (
  expense_id    SERIAL PRIMARY KEY,
  category      VARCHAR(30) NOT NULL CHECK (category IN ('administrativo', 'orden_compra')),
  amount        NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  expense_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  description   TEXT,
  -- Solicitud de reposición que originó el gasto (solo categoría orden_compra)
  order_id      INTEGER REFERENCES orders(order_id) ON DELETE SET NULL,
  created_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);

ALTER TABLE sell_items ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(10, 2);

UPDATE sell_items si
SET unit_cost = i.purchase_price
FROM inventory i
WHERE si.inventory_id = i.inventory_id
  AND si.unit_cost IS NULL;

COMMIT;
