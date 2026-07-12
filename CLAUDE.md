# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

BioFarm — a pharmacy management system built with Next.js 16 (App Router) + React 19, MUI + Tailwind CSS v4, and PostgreSQL (`pg`). Manages products, inventory, sales, purchase orders, suppliers, employees, and users, with role-based access and audit logging.

## Commands

```bash
pnpm dev              # Dev server with Turbopack (http://localhost:3000)
pnpm build            # Production build
pnpm start            # Start production build
pnpm lint             # ESLint (next/core-web-vitals, next/typescript)

pnpm test             # Jest unit tests
pnpm test:watch       # Jest watch mode
pnpm test:coverage    # Jest with coverage
pnpm test -- path/to/file.test.ts        # Run a single test file
pnpm test -- -t "test name"              # Run tests matching a name

pnpm test:e2e         # Playwright E2E tests (tests/e2e/)
pnpm test:e2e:ui      # Playwright UI mode
```

### Local database

```bash
docker compose up -d postgres    # Postgres 16, auto-loads db/schema.sql on first init
psql "$DB_CONNECTION" -f db/schema.sql              # (re)create schema from scratch
psql "$DB_CONNECTION" -f db/seed_data_inventario.sql  # load real inventory seed data
```

`db/migrations/` holds incremental SQL to apply against an existing (e.g. Supabase production) database without dropping data — do not rerun `schema.sql` against a live DB that already has data.

Required env vars: `DB_CONNECTION` (Postgres connection string; SSL is auto-disabled for localhost/127.0.0.1 hosts, enabled otherwise) and `SESSION_SECRET` (≥32 chars, used to sign session JWTs — auth endpoints throw a clear error if it's missing). See `.env.sample`.

## Architecture

### Routing and pages
- App Router under `src/app/`. Authenticated panel pages live in the `(dashboard)` route group: `src/app/(dashboard)/[domain]/page.tsx` for `products`, `inventory`, `areas`, `inventory-validations`, `sells`, `cash-register-closures`, `orders` (restock requests: missing products + note, not formal purchase orders), `expenses` (admin-only), `suppliers`, `employees`, `users`, `reports` (sales report, not to be confused with `inventory-validations`), `configuracion`, `dashboard`.
- Public routes: `/` and `/login` (see `PUBLIC_PATHS` in `src/middleware.ts`).
- API routes mirror the domain structure under `src/app/api/[domain]/route.ts` (+ `[id]/route.ts` for item-level GET/PUT/DELETE).

### Auth, sessions, and authorization
- `src/lib/auth.ts`: password hashing (bcryptjs) and stateless sessions — a JWT (jose, HS256) signed with `SESSION_SECRET`, stored in an httpOnly cookie (`biofarm_session`, 8h expiry). `getSessionFromRequest()` reads/verifies it from a request.
- `src/lib/permissions.ts`: defines roles (`admin`, `farmaceutico`, `cajero`) and which panel paths each role may access (`ROLE_PERMISSIONS`, checked via `roleCanAccess`). `admin` has `"*"` access.
- `src/middleware.ts` is the single enforcement point: unauthenticated requests are redirected to `/login` (pages) or get a 401 JSON response (`/api/*`); authenticated but unauthorized page requests are redirected to `/dashboard`. Role checks are **not** applied to `/api/*` routes — API handlers only verify a session exists, so any authenticated user can call any API endpoint (UI-level filtering assumes this).
- Auth API routes live in `src/app/api/auth/{login,logout,me}/route.ts`.
- See `db/AUTENTICACION.md` for the role/permission matrix, seeded accounts, and how auth was rolled out to this repo (written in Spanish, like most in-repo docs and DB comments).

### Database access pattern
- `src/config/db.js` exports a single shared `pg` `Pool` (`pool`), configured from `DB_CONNECTION`.
- API route handlers call `pool.connect()`, run parameterized queries directly (no ORM/query builder), and always `client.release()` in a `finally` block.
- Mutations that create/update/delete typically call `logAudit(userId, action, entityType, entityId, details)` from `src/lib/audit.ts` afterward, writing to the `audit_log` table. Audit logging never throws — a failure there must not break the underlying operation.
- Schema source of truth is `db/schema.sql` (tables: `users`, `products`, `suppliers`, `inventory`, `inventory_areas`, `inventory_movements`, `employees`, `orders`/`order_items`, `sells`/`sell_items`, `cash_register_closures`, `expenses`, `configuracion`, `audit_log`, `inventory_validations`/`inventory_validation_items`). Incremental changes go in `db/migrations/`.
- `db/etl/build_seed.py` regenerates `db/seed_data_inventario.sql` from the source Excel inventory file (requires `pandas`, `openpyxl`); `db/etl_review_report.csv` documents row-level decisions made during that import.

### Frontend data flow
- `src/services/[domain]Service.ts` wrap `fetch` calls to the domain's API routes; `src/services/api.ts` has a generic `apiRequest` helper.
- `src/hooks/use[Domain].ts` wrap services for use in client components (mutation helpers — create/update/delete — that throw on non-OK responses).
- `src/components/[domain]/*Form.tsx` are the create/edit forms per domain; page components in `src/app/(dashboard)/[domain]/page.tsx` compose lists (often MUI `DataGrid`) with these forms.
- `src/types/[domain].ts` define the shared TypeScript shapes used across services, hooks, forms, and API routes for that domain.

### Notable setup
- `moment.js` is locale-set to Spanish (`moment.locale("es")`); date formatting helpers live in `src/utils/dateUtils.ts`.
- MUI `ThemeRegistry` (`src/components/ThemeRegistry/`) wraps the app in `src/app/layout.tsx`; theme customization is in `theme.ts`.
- Cron jobs are triggered client-side via `src/components/CronInitializer.tsx`, which fires `/api/cron/init` on mount; job definitions live under `src/app/api/cron/`.
- Path alias `@/` maps to `src/` (see `tsconfig.json` and the Jest `moduleNameMapper`).

## Testing conventions
- Unit tests: `src/**/__tests__/**/*.{ts,tsx}` or `src/**/*.{test,spec}.{ts,tsx}`, run under `jest-environment-jsdom` via `next/jest`.
- `jest.setup.js` provides global mocks: `next/navigation` router/search params/pathname, `fetch`, `matchMedia`, `IntersectionObserver`, `ResizeObserver`, and silenced `console.warn`/`console.error`.
- E2E tests: Playwright, `tests/e2e/`, against `chromium`/`firefox`/`webkit`/`Mobile Chrome`/`Mobile Safari`, auto-starting `pnpm dev` if not already running (`webServer` in `playwright.config.ts`).
