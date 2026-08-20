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

## Historical dataset and baselines (Phase 8)

The offline evaluation workflow builds reproducible Central Florida examples from archived forecast and observation snapshots; it does not affect production forecasts. An example is retained only when every forecast input was available at or before its issue time, the prediction precedes its target window, and a measurable outcome can be matched within 5 km during that window.

Measurable rain means at least `0.1 mm` in the matched observation. Each row retains source IDs, the forecast `dataAsOf` timestamp, and the matched outcome source. It includes three reference forecasts: the archived NWS probability, a transparent HRRR amount-to-probability reference, and their equal-weight average. These are evaluation baselines, not calibrated claims or Puddle model output.

Build a dataset from a versioned JSON snapshot archive with an explicit, fixed build time:

```bash
npm run dataset:build -- data/raw/central-florida.json data/derived/central-florida.json 2026-08-21T00:00:00.000Z
```

The input has `snapshots` (with `issuedAt`, `availableAt`, location, target window, NWS probability, HRRR precipitation, and source IDs) and `observations` (with `observedAt`, `availableAt`, location, precipitation, and source ID). Outputs are deterministic for identical input and build timestamp.

## Persistence (Phase 6)

Forecast provenance is stored only when both server-only variables in `.env.local` are set:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your-supabase-secret-key
```

The service role key is intentionally never exposed to the browser. Without those variables (or while Supabase is unavailable), anonymous live forecasts continue normally and the history endpoint returns an unavailable persistence state.

Schema changes are version-controlled in `supabase/migrations`. With the Supabase CLI and local stack available, reset an empty database with:

```bash
npx supabase db reset
```

The migration enables PostGIS, creates forecast runs, horizon predictions, source snapshots, verification records, and an auth-ready saved-locations table. Database tables have RLS enabled and no public policies; server routes use the service role only for controlled forecast persistence.
