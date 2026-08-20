# Puddle Repository Rules

## Sources of truth

Before implementing any phase, read:

- `PRD.md` — product requirements and constraints.
- `docs/IMPLEMENTATION_PLAN.md` — phase scope and execution order.
- `docs/SUCCESS_CRITERIA.md` — the definition of done.

Do not duplicate these documents here.

## Engineering rules

- Use simple code, obvious control flow, descriptive names, small understandable modules, and only the architecture required by the current phase.
- Avoid premature abstractions, speculative architecture, microservices, unnecessary wrappers or dependencies, giant utility files, duplicate systems, placeholder production logic, dead code, and commented-out obsolete code.
- When new code supersedes an old path, delete the old path. Prefer the implementation a new engineer can understand immediately.
- Never commit secrets, fake production weather, random production forecasts, or knowingly broken or incomplete work.

## Product rules

Puddle answers: **Will measurable rain hit this exact selected location?**

- Initial geography: Central Florida.
- Forecast horizons: `15m`, `30m`, `1h`, `2h`, `6h`.
- The 1-hour forecast is the hero product.
- Preserve the core flow: select place → understand next-hour rain risk → see what rain is doing on the map → optionally understand why.
- Do not turn Puddle into a generic weather dashboard.

## UI/UX rules

UI/UX is a first-class feature. Build a polished consumer product, not an engineering dashboard or generated SaaS template.

- Prioritize location, hero next-hour probability, weather map, rain timing, forecast horizons, and the Why explanation.
- Avoid excessive cards or pills, giant gradients, pervasive glassmorphism, generic AI branding, fake charts, clutter, and developer-facing meteorological values in the primary UI.
- Use available frontend, design, and image capabilities when they materially improve the result.
- The Puddle mascot is required. Reproduce approved visual references faithfully in application code or assets instead of substituting generic icons.

## Phase workflow

For a request to complete a phase:

1. Read this file, that phase in `docs/IMPLEMENTATION_PLAN.md`, relevant requirements in `PRD.md`, and `docs/SUCCESS_CRITERIA.md`.
2. Inspect the repository, existing implementation, and tests.
3. Implement only the requested phase; remove stale or superseded code.
4. For each independently working logical unit, inspect its diff, run relevant checks, commit with a descriptive conventional message, immediately push to `origin/main`, and verify the push. Never push known-broken or incomplete work.
5. At phase end, run all relevant tests, lint, typecheck, production build, end-to-end verification, and UI visual inspection when applicable.
6. Audit against `docs/SUCCESS_CRITERIA.md`, fix failures in separate verified commits, and push each fix.
7. Inspect the final diff and repository state; confirm the worktree is clean and `main` matches `origin/main`.
8. Provide the completion report defined below, then stop. Never begin the next phase automatically.

Use only `main` unless a task explicitly requires another branch. Never force-push or rewrite pushed history unless explicitly instructed.

One independently understandable, verified change equals one commit. Do not create artificial tiny commits or combine independently complete features into one large commit.

## Phase completion report

```text
Phase:
Status:

Implemented:
- ...

Tests:
- ...

End-to-end verification:
- ...

UI/UX audit:
- ...

Commits:
- <hash> <message>

Known limitations:
- ...

Ready for next phase:
Yes/No
```

List every commit created and pushed during the phase, then stop.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
