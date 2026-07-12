-- =============================================================================
-- Migración 012 — Parámetros operativos reales en "configuracion"
-- =============================================================================
-- Reemplaza el único campo que tenía la tabla "configuracion"
-- (dias_notificacion_cobranza) por dos parámetros operativos que sí se usan
-- en el sistema:
--   - low_stock_threshold: umbral de "bajo stock" para inventory-validations
--     y el chequeo de vencimientos/stock de /api/cron (antes hardcodeado a 10
--     en src/app/api/inventory-validations/route.ts).
--   - expiry_alert_days: días de anticipación para considerar un lote
--     "próximo a vencer" (antes hardcodeado a 40 días en el mismo archivo).
--
-- dias_notificacion_cobranza era vestigial: no existe ninguna tabla de
-- créditos/cuentas por cobrar en el esquema, la página que lo leía apuntaba
-- a una ruta API que nunca existió (/api/configuracion vs. carpeta real
-- api/configuration/, vacía) y el endpoint de email relacionado
-- ("Sistema de Cobranzas") no tenía ningún caller. No hay dato real que
-- preservar.
--
-- Ejecutar:
--   psql "$DB_CONNECTION" -f db/migrations/012_configuracion_operational_params.sql
-- =============================================================================

BEGIN;

ALTER TABLE configuracion
  DROP COLUMN IF EXISTS dias_notificacion_cobranza;

ALTER TABLE configuracion
  ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER NOT NULL DEFAULT 10 CHECK (low_stock_threshold >= 0),
  ADD COLUMN IF NOT EXISTS expiry_alert_days   INTEGER NOT NULL DEFAULT 40 CHECK (expiry_alert_days >= 0);

COMMIT;
