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

## Puddle model training (Phase 9)

The first production candidate is deliberately small: a calibrated logistic regression using an archived next-hour forecast feature. Training is chronological: all training rows precede the held-out validation period. The trainer rejects leakage, requires at least 52 eligible rows, applies Platt calibration, and writes an artifact only when the calibrated model improves held-out Brier score over its archived baseline with both rain and non-rain validation examples.

```bash
npm run model:train -- data/derived/central-florida.json data/models/puddle-logistic-v1.json 2026-08-21T00:00:00.000Z
```

The generated artifact records its feature contract, normalization, calibration, source dataset schema, time range, and validation metrics. `data/models` is ignored by default: review a candidate artifact before promoting it through the release process. When no valid artifact is present, malformed, or lacks a feature available at inference time, the live forecast remains the transparent provider-derived NWS guidance. This avoids unsupported performance claims while the historical archive grows.

For the archived HRRR candidate, use the NOAA-backed collector in an environment with `herbie-data` and `cfgrib` installed. It pairs NOAA HRRR 0–1 hour accumulated precipitation at KMLB's nearest 3 km grid point with NCEI Global Hourly AA1 precipitation observations, preserving source URLs and timestamps.

```bash
python scripts/gather-hrrr-historical-data.py 2025-07-01T00:00:00Z 2025-07-13T00:00:00Z 3 data/raw/hrrr-kmlb-2025-07.json
npm run dataset:build -- data/raw/hrrr-kmlb-2025-07.json data/derived/hrrr-kmlb-2025-07.json 2026-08-20T00:00:00.000Z
npm run model:train -- data/derived/hrrr-kmlb-2025-07.json data/models/puddle-hrrr-logistic-candidate-v1.json 2026-08-20T00:00:00.000Z puddle-hrrr-logistic-candidate-v1 hrrrPrecipitationMm
```

The HRRR artifact is an offline candidate only: Puddle does not yet acquire HRRR live, so inference correctly falls back to provider-derived NWS guidance rather than substituting a non-parity feature.

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
