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

The application uses the Next.js App Router, TypeScript, plain global CSS, Vitest, and Playwright. This deliberately small foundation is suitable for Vercel without repository-specific deployment configuration.
