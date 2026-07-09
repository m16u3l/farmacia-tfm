# AGENTS.md

## Project Overview
Next.js 15 + React 19 pharmacy management system (BioFarm) with MUI, Tailwind CSS, PostgreSQL.

## Developer Commands
```bash
pnpm dev          # Dev server with Turbopack (http://localhost:3000)
pnpm build        # Production build
pnpm lint         # ESLint (extends next/core-web-vitals, next/typescript)
pnpm test         # Jest unit tests
pnpm test:watch   # Jest watch mode
pnpm test:e2e     # Playwright E2E tests (tests/e2e/)
pnpm test:e2e:ui  # Playwright UI mode
```

## Path Alias
`@/` maps to `./src/` (tsconfig.json paths)

## Architecture
- **Pages**: `src/app/[domain]/` (employees, inventory, orders, products, sells, suppliers, users, validations, configuracion)
- **API Routes**: `src/app/api/[domain]/`
- **Services**: `src/services/` (api.ts, employeeService.ts, inventoryService.ts, orderService.ts, sellService.ts, supplierService.ts)
- **Components**: `src/components/[domain]/`
- **Config**: `src/config/db.js` (PostgreSQL via Supabase)
- **Cron jobs**: Initialized via `src/components/CronInitializer.tsx`

## Testing Conventions
- Unit tests: `src/**/__tests__/**/*.{ts,tsx}` or `src/**/*.{test,spec}.{ts,tsx}`
- E2E tests: `tests/e2e/`
- Jest setup includes mocks for Next.js router, fetch, matchMedia, IntersectionObserver, ResizeObserver
- Mocks are in `jest.setup.js`

## Database
- PostgreSQL via Supabase (connection string in `.env.local`)
- `envConfig.ts` loads environment variables for Next.js

## Notable Setup
- moment.js configured for Spanish locale (`moment.locale("es")`)
- MUI ThemeRegistry wraps the app in `src/app/layout.tsx`
- Tailwind CSS v4 via `@tailwindcss/postcss`
