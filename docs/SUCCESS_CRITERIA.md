# Puddle Success Criteria

Audit every completed phase against the applicable items below. A phase is not done while an applicable item fails or remains unverified without a stated reason.

## Product

- [ ] The selected location is unmistakable.
- [ ] Next-hour rain probability is unmistakable, and the 1-hour forecast has the strongest hierarchy.
- [ ] The `15m`, `30m`, `1h`, `2h`, and `6h` horizons are clear.
- [ ] A user can understand the primary screen quickly.
- [ ] Observed and projected weather are visually distinct.
- [ ] Sources and freshness are available.
- [ ] Production uses no fake weather data.
- [ ] Limitations and uncertainty are not hidden.

## UI/UX

- [ ] The product looks like a polished consumer app, not a generic AI dashboard.
- [ ] Mobile is intentionally designed and remains usable around 320px wide.
- [ ] There is no page-level horizontal overflow.
- [ ] The map has useful size and prominence.
- [ ] Hierarchy, spacing, typography, and numerical forecast readability are intentional and consistent.
- [ ] Controls are touch-friendly.
- [ ] Loading and error states are useful and human-readable.
- [ ] The mascot feels integrated, not pasted on; no placeholder visual assets remain.
- [ ] Animation explains state and respects reduced-motion preferences.
- [ ] Basic keyboard and accessibility support works.
- [ ] The UI is visually audited at meaningful milestones on relevant desktop and mobile viewports.

## Engineering

- [ ] Lint passes.
- [ ] Typecheck passes.
- [ ] Tests pass.
- [ ] Production build passes.
- [ ] No unused implementation, obsolete commented-out blocks, or duplicate component systems remain.
- [ ] Every dependency is necessary and used.
- [ ] No secrets are committed.
- [ ] No hardcoded fake forecast or random production weather values exist.
- [ ] Names and directory structure are understandable.
- [ ] Provider failures degrade gracefully.

## Weather/Data

- [ ] Real sources are attributed and source timestamps are retained.
- [ ] Timestamps are handled consistently.
- [ ] Training and evaluation contain no future-data leakage.
- [ ] Observed, model, and projected data are distinguished.
- [ ] Model versions are recorded where relevant.
- [ ] Evaluation is reproducible.
- [ ] Calibration is measured.
- [ ] Appropriate NWS, HRRR, and simple-ensemble baselines are used.

## Git

- [ ] Commits are coherent and descriptively named.
- [ ] Every pushed commit is a verified, known-working checkpoint.
- [ ] Each working logical commit is pushed to `origin/main` after verification.
- [ ] No unrelated changes are mixed into commits.
- [ ] No knowingly broken or unfinished work is pushed.
- [ ] The worktree is clean at phase completion.
- [ ] `main` matches `origin/main` at phase completion.
