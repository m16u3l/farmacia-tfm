# AGENTS.md

## Project Overview
Next.js 16 (App Router) + React 19 pharmacy management system (BioFarm) with MUI, Tailwind CSS v4, PostgreSQL.

See `CLAUDE.md` for the full architecture writeup — this file is a quick-reference subset.

## Developer Commands
```bash
pnpm dev          # Dev server with Turbopack (http://localhost:3000)
pnpm build        # Production build
pnpm lint         # ESLint (flat config, eslint.config.mjs — extends eslint-config-next)
pnpm test         # Jest unit tests
pnpm test:watch   # Jest watch mode
pnpm test:e2e     # Playwright E2E tests (tests/e2e/)
pnpm test:e2e:ui  # Playwright UI mode
```

## Path Alias
`@/` maps to `./src/` (tsconfig.json paths)

## Architecture
- **Pages**: `src/app/(dashboard)/[domain]/` (products, inventory, areas, inventory-validations, sells, cash-register-closures, orders, suppliers, employees, users, validations, configuracion, dashboard)
- **API Routes**: `src/app/api/[domain]/`
- **Services**: `src/services/[domain]Service.ts` wrap `fetch` calls; `src/hooks/use[Domain].ts` wrap services for client components
- **Components**: `src/components/[domain]/`
- **Config**: `src/config/db.js` (PostgreSQL via Supabase, single shared `pg` `Pool`)
- **Cron jobs**: `src/app/api/cron/route.ts`, protected by `CRON_SECRET`, wired via `"crons"` in `vercel.json`

## Testing Conventions
- Unit tests: `src/**/__tests__/**/*.{ts,tsx}` or `src/**/*.{test,spec}.{ts,tsx}`
- E2E tests: `tests/e2e/`
- Jest setup includes mocks for Next.js router, fetch, matchMedia, IntersectionObserver, ResizeObserver
- Mocks are in `jest.setup.js`

## Database
- PostgreSQL via Supabase (connection string in `.env.local`)
- `envConfig.ts` loads environment variables for Next.js
- `db/migrations/` holds incremental SQL; `db/scripts/{backup,migrate}.sh` apply them

## Notable Setup
- moment.js configured for Spanish locale (`moment.locale("es")`)
- MUI ThemeRegistry wraps the app in `src/app/layout.tsx`
- Tailwind CSS v4 via `@tailwindcss/postcss`
