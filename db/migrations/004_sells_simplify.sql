-- =============================================================================
-- Migración 004 — Ventas: simplificar (quitar cliente/empleado, cerrar payment_method)
-- =============================================================================
-- Paso "contract" de la migración 003. Solo ejecutar DESPUÉS de confirmar que
-- el código desplegado en producción ya no envía payment_method fuera de
-- ('efectivo', 'qr_transferencia') ni lee/escribe customer_name/employee_id
-- (backend: src/app/api/sells/route.ts y [id]/route.ts; frontend: SellForm.tsx
-- y sells/page.tsx). Antes de correr esto, verificar con:
--   SELECT payment_method, count(*) FROM sells GROUP BY payment_method;
--
-- Ejecutar:
--   psql "$DB_CONNECTION" -f db/migrations/004_sells_simplify.sql
-- =============================================================================

BEGIN;

-- 1) Backfill: los valores viejos que no sean 'efectivo' pasan a
--    'qr_transferencia'. Incluye 'transferencia' además de 'tarjeta'/'seguro':
--    si se omite, el ADD CONSTRAINT del paso 2 falla porque Postgres valida
--    todas las filas existentes contra el CHECK nuevo.
UPDATE sells
SET payment_method = 'qr_transferencia'
WHERE payment_method IN ('tarjeta', 'seguro', 'transferencia');

-- 2) Restringir el CHECK a los 2 valores finales.
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
  CHECK (payment_method IN ('efectivo', 'qr_transferencia'));

-- 3) Quitar customer_name y employee_id. Ambas nullable, sin dependencias
--    detectadas más allá del FK propio de employee_id -> DROP COLUMN simple.
ALTER TABLE sells DROP COLUMN IF EXISTS customer_name;
ALTER TABLE sells DROP COLUMN IF EXISTS employee_id;

COMMIT;
