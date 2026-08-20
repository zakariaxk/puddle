# Puddle

Puddle will answer one focused question: will measurable rain hit an exact selected location? Phase 0 provides the deployment-ready application foundation only; product functionality begins in later phases.

## Requirements

- Node.js 20.9 or newer
- npm 11 or newer

## Local setup

```bash
npm ci
npx playwright install chromium
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Phase 0 does not require environment variables; copy `.env.example` only when a later phase adds a documented variable.

## Commands

```bash
npm run dev       # development server
npm run lint      # ESLint
npm run typecheck # TypeScript without emitting files
npm test          # unit tests
npm run test:e2e  # browser smoke test
npm run build     # production build
npm run start     # serve the production build
npm run verify    # lint, typecheck, unit tests, and build
```

The application uses the Next.js App Router, TypeScript, plain global CSS, Vitest, Playwright, and an optional server-only Supabase persistence path.

## Persistence (Phase 6)

Forecast provenance is stored only when both server-only variables in `.env.local` are set:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The service role key is intentionally never exposed to the browser. Without those variables (or while Supabase is unavailable), anonymous live forecasts continue normally and the history endpoint returns an unavailable persistence state.

Schema changes are version-controlled in `supabase/migrations`. With the Supabase CLI and local stack available, reset an empty database with:

```bash
npx supabase db reset
```

The migration enables PostGIS, creates forecast runs, horizon predictions, source snapshots, verification records, and an auth-ready saved-locations table. Database tables have RLS enabled and no public policies; server routes use the service role only for controlled forecast persistence.
