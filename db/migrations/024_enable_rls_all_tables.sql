-- =============================================================================
-- Migración 024 — Habilitar RLS en todas las tablas públicas
-- =============================================================================
-- El Security Advisor de Supabase reporta "RLS Disabled in Public" para las
-- tablas creadas por migraciones posteriores al schema original (en las tablas
-- viejas RLS se habilitó a mano desde el dashboard). Sin RLS, esas tablas
-- quedan expuestas a lectura/escritura vía la API pública de Supabase
-- (PostgREST con la anon key).
--
-- El patrón del proyecto es "RLS habilitado sin policies": eso niega todo
-- acceso vía PostgREST, y NO afecta a la app, porque se conecta directo por
-- Postgres como el rol `postgres`, que es dueño de las tablas y por lo tanto
-- omite RLS (no se usa FORCE ROW LEVEL SECURITY).
--
-- Se listan las 17 tablas (no solo las 7 sin RLS) para que la migración deje
-- cualquier base — local o Supabase — en el mismo estado final. Es idempotente.
--
-- Ejecutar:
--   psql "$DB_CONNECTION" -f db/migrations/024_enable_rls_all_tables.sql

ALTER TABLE IF EXISTS audit_log                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cash_register_closures     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS configuracion              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS employees                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS expenses                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventory                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventory_areas            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventory_movements        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventory_validation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventory_validations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_items                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sell_items                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sells                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS suppliers                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users                      ENABLE ROW LEVEL SECURITY;
