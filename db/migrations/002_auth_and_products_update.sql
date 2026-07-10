-- =============================================================================
-- Migración 002 — Autenticación con roles + campos reales del Excel
-- =============================================================================
-- Para bases de datos YA desplegadas (ej. tu Supabase actual) creadas con una
-- versión anterior de db/schema.sql. No borra datos existentes.
--
-- Ejecutar:
--   psql "$DB_CONNECTION" -f db/migrations/002_auth_and_products_update.sql
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- users: login, roles y estado de la cuenta
-- -----------------------------------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'cajero';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_role_check
      CHECK (role IN ('admin', 'farmaceutico', 'cajero'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_employee'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT fk_users_employee
      FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE SET NULL;
  END IF;
END $$;

-- Si ya tenías usuarios sin contraseña, les asigna una temporal para que no
-- queden bloqueados fuera del sistema. CÁMBIALA de inmediato tras la migración.
UPDATE users SET password_hash = crypt('cambiar-esta-clave', gen_salt('bf'))
WHERE password_hash IS NULL;

ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;

-- -----------------------------------------------------------------------------
-- products: instrucciones de dosificación + trazabilidad de quién lo creó
-- -----------------------------------------------------------------------------
ALTER TABLE products ADD COLUMN IF NOT EXISTS dosage_instructions TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- inventory: marca de vencimiento aproximado + trazabilidad
-- -----------------------------------------------------------------------------
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS expiry_is_approximate BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- orders / sells: quién registró cada operación
-- -----------------------------------------------------------------------------
ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE sells ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- audit_log: bitácora de cambios
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action       VARCHAR(10) NOT NULL CHECK (action IN ('create', 'update', 'delete', 'login')),
  entity_type  VARCHAR(50) NOT NULL,
  entity_id    INTEGER,
  details      JSONB,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- -----------------------------------------------------------------------------
-- Cuenta admin de respaldo, solo si la tabla users quedó vacía
-- -----------------------------------------------------------------------------
INSERT INTO users (first_name, last_name, email, password_hash, role)
SELECT 'Admin', 'BioFarm', 'admin@biofarm.bo', crypt('biofarm2026', gen_salt('bf')), 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users);

COMMIT;
