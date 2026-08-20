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

## Production ML (Phase 13)

### Live inference

- [ ] Production can retrieve current HRRR features for a Central Florida coordinate.
- [ ] Current feature definitions, units, windows, grid interpretation, and normalization match the training contract.
- [ ] Every required promoted-model feature is available, valid, and fresh in production.
- [ ] The live forecast API invokes the trained promoted model when its feature contract is satisfied.
- [ ] Calibrated ML output drives the 1-hour hero forecast when inference succeeds.
- [ ] The response identifies `puddle_ml` versus `provider_fallback` forecast origin.
- [ ] Model version is returned and recorded for ML forecasts.

### Training

- [ ] The dataset is materially larger than the previous 57-row candidate and uses real historical data only.
- [ ] Training data includes rain and non-rain examples across representative Central Florida conditions.
- [ ] Validation is chronological, with both rain and non-rain held-out examples.
- [ ] No training row contains timestamp leakage: every input was available at prediction time and its target was observed later.
- [ ] The feature contract is identical between training and production inference.
- [ ] The promoted artifact is reproducible and records feature metadata, calibration, time ranges, class counts, metrics, and baselines.

### Evaluation

- [ ] Brier score is measured for raw and calibrated Puddle probabilities.
- [ ] Calibration is measured and recorded.
- [ ] NWS, HRRR, and simple equal-weight ensemble baselines are measured on the same held-out data.
- [ ] A model is promoted only after passing the documented feature-parity, leakage, validation, calibration, and baseline-improvement rule.
- [ ] No unsupported accuracy claim is made.

### Reliability

- [ ] Required-source failure falls back cleanly to provider-derived guidance.
- [ ] Missing, malformed, unpromoted, or incompatible artifacts fall back cleanly.
- [ ] Stale required inputs never silently produce an ML forecast.
- [ ] Fallback origin is clearly marked in the internal/API contract and never presented as Puddle ML.
- [ ] The app remains functional without ML.

### Production proof

- [ ] A real current Central Florida location is tested end to end without mocks.
- [ ] Current HRRR data is obtained and the feature vector is built against the promoted-model contract.
- [ ] Inference executes and returns a calibrated probability through the real forecast API.
- [ ] The UI renders the ML probability and subtle provenance.
- [ ] The forecast is persisted with model version, forecast source, compact feature snapshot, and source timestamps.
- [ ] A deliberately unavailable required ML source verifies the provider fallback API and UI path.

## Git

- [ ] Commits are coherent and descriptively named.
- [ ] Every pushed commit is a verified, known-working checkpoint.
- [ ] Each working logical commit is pushed to `origin/main` after verification.
- [ ] No unrelated changes are mixed into commits.
- [ ] No knowingly broken or unfinished work is pushed.
- [ ] The worktree is clean at phase completion.
- [ ] `main` matches `origin/main` at phase completion.
