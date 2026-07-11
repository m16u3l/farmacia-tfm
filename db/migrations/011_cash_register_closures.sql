-- =============================================================================
-- Migración 011 — Cierres de caja
-- =============================================================================
-- Agrega la tabla cash_register_closures y sells.closure_id:
-- 1) cash_register_closures: cada fila es un cierre de caja de un usuario,
--    con el snapshot de totales (por método de pago) de las ventas incluidas,
--    el conteo físico de efectivo y la diferencia resultante (faltante/sobrante).
--    Un usuario puede cerrar su caja más de una vez por día — cada cierre
--    agrupa las ventas propias que aún no pertenecían a un cierre anterior.
-- 2) sells.closure_id: referencia al cierre que incluyó la venta (NULL =
--    todavía pendiente de cierre). Una vez asignado, la venta queda bloqueada
--    para editar/eliminar salvo por un administrador (ver
--    src/app/api/sells/[id]/route.ts).
--
-- Additiva/segura de ejecutar en cualquier momento (no toca datos existentes).
--
-- Ejecutar:
--   psql "$DB_CONNECTION" -f db/migrations/011_cash_register_closures.sql
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS cash_register_closures (
  closure_id              SERIAL PRIMARY KEY,
  user_id                 INTEGER REFERENCES users(id) ON DELETE SET NULL,
  period_start            TIMESTAMP NOT NULL,
  period_end              TIMESTAMP NOT NULL,
  status                  VARCHAR(20) NOT NULL DEFAULT 'closed' CHECK (status IN ('closed', 'cancelled')),
  sell_count               INTEGER NOT NULL DEFAULT 0,
  total_amount             NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  total_efectivo           NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total_efectivo >= 0),
  total_qr_transferencia   NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total_qr_transferencia >= 0),
  counted_cash             NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (counted_cash >= 0),
  cash_difference          NUMERIC(10, 2) NOT NULL DEFAULT 0,
  notes                    TEXT,
  closed_at                TIMESTAMP NOT NULL DEFAULT NOW(),
  cancelled_by             INTEGER REFERENCES users(id) ON DELETE SET NULL,
  cancelled_at             TIMESTAMP
);

ALTER TABLE sells
  ADD COLUMN IF NOT EXISTS closure_id INTEGER REFERENCES cash_register_closures(closure_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sells_closure_id ON sells(closure_id);
CREATE INDEX IF NOT EXISTS idx_cash_register_closures_user_id ON cash_register_closures(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_register_closures_status ON cash_register_closures(status);

COMMIT;
