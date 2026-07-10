-- =============================================================================
-- Migración 003 — Ventas: admitir 'qr_transferencia' como método de pago
-- =============================================================================
-- Paso "expand" de una migración expand/contract: solo AÑADE el nuevo valor
-- permitido en el CHECK de sells.payment_method, sin quitar los valores viejos
-- ('efectivo', 'tarjeta', 'seguro', 'transferencia') ni tocar datos existentes.
-- Segura de ejecutar en cualquier momento, incluso antes de desplegar el
-- código nuevo — el código actual sigue funcionando igual.
--
-- El paso "contract" (quitar los valores viejos, backfill de datos históricos,
-- y eliminar customer_name/employee_id) va en la migración 004, y solo debe
-- correrse después de confirmar que el código que ya no usa esos valores/
-- columnas está desplegado en producción.
--
-- Ejecutar:
--   psql "$DB_CONNECTION" -f db/migrations/003_sells_payment_method_expand.sql
-- =============================================================================

BEGIN;

DO $$
DECLARE
  v_conname text;
BEGIN
  SELECT conname INTO v_conname
  FROM pg_constraint
  WHERE conrelid = 'sells'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%payment_method%';

  IF v_conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE sells DROP CONSTRAINT %I', v_conname);
  END IF;
END $$;

ALTER TABLE sells ADD CONSTRAINT sells_payment_method_check
  CHECK (payment_method IN ('efectivo', 'tarjeta', 'seguro', 'transferencia', 'qr_transferencia'));

COMMIT;
