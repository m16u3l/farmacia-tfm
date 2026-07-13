# BioFarm — Sistema de gestión de farmacia

Next.js 16 (App Router) + React 19, MUI + Tailwind CSS v4, PostgreSQL (`pg`, sin ORM). Gestión de productos, inventario (por áreas), ventas, órdenes de compra, proveedores, empleados y usuarios, con roles y bitácora de auditoría.

Ver también [`CLAUDE.md`](./CLAUDE.md) (arquitectura a fondo) y [`db/AUTENTICACION.md`](./db/AUTENTICACION.md) (roles, cuentas iniciales, importación de datos).

## Requisitos previos

- Node.js 20+
- [pnpm](https://pnpm.io/) 10.8.0 (fijado en `packageManager`; usa `corepack enable` para que se resuelva solo)
- Docker (para Postgres local)

## 1. Primeros pasos (setup local)

```bash
pnpm install
cp .env.sample .env.local
```

Edita `.env.local`:

```bash
DB_CONNECTION=postgresql://postgres:postgres@localhost:5432/farmacia
SESSION_SECRET=<genera una con: openssl rand -base64 32>   # mínimo 32 caracteres
```

> ⚠️ **Antes de cualquier sesión de pruebas locales**, confirma que la línea `DB_CONNECTION` *sin comentar* en `.env.local` apunta a `localhost` y no a la cadena de Supabase (producción). Es fácil dejar la de Supabase activa por accidente y terminar escribiendo datos de prueba en producción. Verificación rápida una vez levantado `pnpm dev`:
> ```bash
> lsof -p <pid-del-proceso-next> -nP | grep 5432   # debe mostrar [::1]:5432 o 127.0.0.1:5432, NUNCA un host *.supabase.com
> ```

Levanta Postgres local (crea la BD `farmacia` y carga `db/schema.sql` automáticamente la primera vez, vía `docker-entrypoint-initdb.d`):

```bash
docker compose up -d postgres
```

Si necesitas recrear el esquema desde cero contra esa misma BD (por ejemplo porque cambiaste `schema.sql` y quieres reiniciar en vez de escribir una migración):

```bash
docker compose down -v          # borra el volumen -> el próximo "up" vuelve a correr schema.sql
docker compose up -d postgres
```

O, sin tocar el contenedor, re-aplicar el esquema a mano (⚠️ recrea tablas, borra datos):

```bash
psql "$DB_CONNECTION" -f db/schema.sql
```

Carga los datos reales de inventario (opcional, ~403 productos / ~415 lotes importados del Excel de la farmacia):

```bash
psql "$DB_CONNECTION" -f db/seed_data_inventario.sql
```

Arranca la app:

```bash
pnpm dev   # http://localhost:3000, con Turbopack
```

### Cuentas iniciales (creadas por `schema.sql`)

| Correo               | Contraseña  | Rol          |
|-----------------------|-------------|--------------|
| admin@biofarm.bo      | biofarm2026 | admin        |
| farmacia@biofarm.bo   | biofarm2026 | farmaceutico |
| caja@biofarm.bo       | biofarm2026 | cajero       |

Cámbialas apenas entres (Usuarios → editar). Detalle de permisos por rol en [`db/AUTENTICACION.md`](./db/AUTENTICACION.md).

## 2. Comandos de desarrollo

```bash
pnpm dev               # dev server con Turbopack
pnpm build              # build de producción
pnpm start              # levanta el build de producción
pnpm lint               # ESLint — actualmente roto en Next.js 16, `next lint` ya no existe; usa `npx tsc --noEmit` para chequeo de tipos mientras tanto
```

## 3. Testing

```bash
pnpm test                                  # Jest, unit tests
pnpm test:watch                            # Jest en watch mode
pnpm test:coverage                         # Jest con cobertura
pnpm test -- path/to/file.test.ts          # un archivo puntual
pnpm test -- -t "nombre del test"          # tests que matcheen un nombre

pnpm test:e2e                              # Playwright (tests/e2e/), levanta pnpm dev solo si no está corriendo
pnpm test:e2e:ui                           # Playwright en modo UI
```

## 4. Base de datos: local vs. Supabase (producción)

No hay ORM ni herramienta de migraciones automatizada (no existe tabla `schema_migrations`): el estado aplicado se rastrea manualmente. `db/schema.sql` es la fuente de verdad del esquema **completo** (para bases nuevas); `db/migrations/*.sql` son los cambios incrementales para aplicar sobre una base **ya existente con datos** (como Supabase producción) sin perder nada.

### Crear una base desde cero (local nueva o Supabase nuevo)

```bash
psql "$DB_CONNECTION" -f db/schema.sql
psql "$DB_CONNECTION" -f db/seed_data_inventario.sql   # opcional, datos reales de inventario
```

### Actualizar una base existente (Supabase producción)

**Opción rápida — scripts (no requieren `psql` instalado, solo Docker):**

```bash
db/scripts/backup.sh "$DB_CONNECTION"     # respaldo completo antes de tocar nada (recomendado)
db/scripts/migrate.sh "$DB_CONNECTION"    # corre TODAS las migraciones pendientes, en orden
db/scripts/migrate.sh "$DB_CONNECTION" 004  # o una sola migración puntual (por su prefijo numérico)
```

Ambos scripts usan un contenedor `postgres:17-alpine` como cliente en vez del `psql`/`pg_dump` local — Supabase corre Postgres 17 y `pg_dump` exige versión de cliente >= servidor, así que un `pg_dump`/`psql` local más viejo (o inexistente) no es un problema.

**Opción manual:**

1. Apunta `DB_CONNECTION` a Supabase (cadena de conexión del pooler — `src/config/db.js` activa SSL automáticamente para cualquier host que no sea `localhost`/`127.0.0.1`/`::1`).
2. Corre las migraciones **en orden**, revisando primero el encabezado de cada archivo (explica qué hace y, si es un paso destructivo, qué verificar antes):
   ```bash
   psql "$DB_CONNECTION" -f db/migrations/002_auth_and_products_update.sql
   psql "$DB_CONNECTION" -f db/migrations/003_sells_payment_method_expand.sql
   psql "$DB_CONNECTION" -f db/migrations/004_sells_simplify.sql
   psql "$DB_CONNECTION" -f db/migrations/005_inventory_areas_and_validations_expand.sql
   psql "$DB_CONNECTION" -f db/migrations/006_inventory_location_drop.sql
   psql "$DB_CONNECTION" -f db/migrations/007_inventory_areas_estante_apartado.sql
   psql "$DB_CONNECTION" -f db/migrations/008_inventory_validations_adjustments.sql
   psql "$DB_CONNECTION" -f db/migrations/009_products_professional_descriptions.sql
   psql "$DB_CONNECTION" -f db/migrations/010_inventory_validation_items_expiry_date.sql
   psql "$DB_CONNECTION" -f db/migrations/011_cash_register_closures.sql
   psql "$DB_CONNECTION" -f db/migrations/012_configuracion_operational_params.sql
   psql "$DB_CONNECTION" -f db/migrations/013_products_identification_fields.sql
   psql "$DB_CONNECTION" -f db/migrations/014_products_sale_control.sql
   psql "$DB_CONNECTION" -f db/migrations/015_validation_items_discrepancy_reason.sql
   psql "$DB_CONNECTION" -f db/migrations/016_orders_restock_requests.sql
   psql "$DB_CONNECTION" -f db/migrations/017_expenses_and_sell_unit_cost.sql
   psql "$DB_CONNECTION" -f db/migrations/018_configuracion_validation_period.sql
   psql "$DB_CONNECTION" -f db/migrations/019_products_low_stock_threshold.sql
   psql "$DB_CONNECTION" -f db/migrations/020_inventory_movements_reason.sql
   ```
3. Antes de correr una migración, **verifica manualmente si ya la corriste antes** (no hay tabla de control) — por ejemplo con `\d nombre_tabla` en `psql` para ver si la columna/tabla ya existe. Correr una migración dos veces puede fallar o duplicar datos según el archivo.

Migraciones de tipo **expand/contract** (dos pasos — no corras el segundo sin haber desplegado antes el código que deja de usar lo viejo):

| Expand (seguro en cualquier momento) | Contract (⚠️ solo después de confirmar que el código desplegado ya no usa lo viejo) |
|---|---|
| `003_sells_payment_method_expand.sql` | `004_sells_simplify.sql` — quita `customer_name`/`employee_id`, cierra el CHECK de `payment_method` |
| `005_inventory_areas_and_validations_expand.sql` | `006_inventory_location_drop.sql` — elimina `inventory.location` |

Resto de migraciones (`002`, `007`, `008`, `009`, `010`, `011`, `012`) son de un solo paso, aditivas.

**Al crear una migración nueva:** revisa `db/migrations/` para ver cuál es el próximo número libre — no asumas que es secuencial solo por lo último que recuerdes, puede haber migraciones de trabajo paralelo (ya pasó: la 009 quedó tomada por otro cambio y una migración tuvo que numerarse 010).

### Qué migraciones hay aplicadas ahora mismo en Supabase

Este repo no lo rastrea automáticamente. No lo asumas de memoria ni de `git log` — verifícalo contra la base (`\d nombre_tabla`, `\d+ nombre_tabla` en `psql`) antes de correr la siguiente migración.

## 5. Variables de entorno

| Variable | Requerida | Notas |
|---|---|---|
| `DB_CONNECTION` | Sí (opcional solo en dev, cae a `postgresql://postgres:postgres@localhost:5432/farmacia`) | SSL se activa automáticamente salvo para `localhost`/`127.0.0.1`/`::1` |
| `SESSION_SECRET` | Sí | ≥32 caracteres, firma los JWT de sesión. Sin ella, el login lanza un error explícito al arrancar. Genera una con `openssl rand -base64 32` |

En Vercel, configúralas en Project Settings → Environment Variables (no están en `vercel.json`).

## 6. Despliegue

`vercel.json` define:

```json
{
  "installCommand": "corepack prepare pnpm@10.8.0 --activate && pnpm i",
  "buildCommand": "pnpm build"
}
```

Antes de desplegar cambios de esquema, corre las migraciones correspondientes contra Supabase (sección 4) — el deploy de código nunca migra la base por sí solo.

## 7. Regenerar el seed de inventario desde el Excel

```bash
cd db/etl
pip install pandas openpyxl
python build_seed.py ruta/a/Inventario_Farmacia_actual.xlsx
```

Genera `db/seed_data_inventario.sql` y `db/etl_review_report.csv` (detalle fila por fila de las correcciones automáticas). Más contexto en [`db/AUTENTICACION.md`](./db/AUTENTICACION.md#5-sobre-los-datos-importados-del-excel).

## Problemas conocidos

- `pnpm lint` está roto en este repo con Next.js 16 (`next lint` ya no existe como comando). Usa `npx tsc --noEmit` para chequeo de tipos mientras tanto.
- `pdfkit` (usado en la exportación de validaciones a PDF) necesita `serverExternalPackages: ["pdfkit"]` en `next.config.ts` para no romper por rutas de archivos `.afm` — ya está configurado, pero si tocas esa config necesitas reiniciar `pnpm dev` (no es hot-reloadable).
