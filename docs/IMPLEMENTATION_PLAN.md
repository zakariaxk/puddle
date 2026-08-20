# Puddle Implementation Plan

Execute one requested phase at a time. Follow `AGENTS.md`; use `PRD.md` for product requirements and `docs/SUCCESS_CRITERIA.md` for the final audit. Commit boundaries below are guidance: create a commit only when the change is independently understandable, working, and verified.

## Phase 0 — Application Foundation

### Goal
Establish a minimal, deployment-ready application toolchain without product functionality.

### Scope
Next.js App Router, TypeScript, styling foundation, lint, typecheck, unit test runner, browser-test foundation, build scripts, environment example, and Vercel-ready structure.

### Out of Scope
Product UI, map, weather providers, forecast logic, Supabase, and production deployment.

### Deliverables
A documented, reproducible local setup with the smallest useful command surface and an immediately rendered application shell.

### Tests
Toolchain smoke test plus passing lint, typecheck, unit tests, and production build.

### End-to-End Verification
Install from a clean dependency state, start the app, load the root route, and confirm the production server can serve the built app.

### UI/UX Verification
Confirm the empty shell has no broken layout or unstyled flash; visual direction is deferred.

### Success Criteria
Applicable Engineering and Git criteria pass; no unused dependency or premature architecture is introduced.

### Commit Plan
Likely one commit for the complete verified application/toolchain foundation.

### Stop Condition
The toolchain is reproducible and verified; Phase 1 has not begun.

## Phase 1 — Product Shell + Visual Direction

### Goal
Create a polished, responsive, visually reviewable Puddle shell with a clear product hierarchy.

### Scope
Brand, typography, design tokens, consumer layout, hero forecast presentation structure, map and search surfaces, mobile/desktop composition, initial production mascot, and intentional loading skeletons.

### Out of Scope
Real map interaction, geocoding, weather data, forecast computation, fake production data, and persistence.

### Deliverables
Responsive shell and mascot assets with explicit unavailable/loading states instead of fabricated forecasts.

### Tests
Component and accessibility tests for hierarchy, states, and core responsive controls.

### End-to-End Verification
Load the shell at representative desktop and mobile viewports and exercise its non-data interactions.

### UI/UX Verification
Use available design capabilities; inspect rendered desktop, tablet, and 320px mobile layouts for hierarchy, overflow, spacing, typography, touch targets, and mascot fidelity.

### Success Criteria
Applicable Product, UI/UX, Engineering, and Git criteria pass; the result does not resemble a generic dashboard.

### Commit Plan
Likely boundaries: design system and brand; responsive forecast shell; mascot and loading states; UI tests.

### Stop Condition
The shell is visually reviewable and verified without pretending real weather exists; Phase 2 has not begun.

## Phase 2 — Location Selection

### Goal
Let users choose an exact Central Florida location through search or the map.

### Scope
Real MapLibre map, Central Florida default extent, open-provider geocoding with caching, map click/tap selection, branded selected-point marker, and local saved places only if justified.

### Out of Scope
Weather overlays, forecasts, accounts, and database persistence.

### Deliverables
Normalized location selection shared by search, map clicks, and optional local saved places.

### Tests
Geocoding normalization, invalid input, provider failure, coordinate bounds, search selection, map selection, and marker behavior.

### End-to-End Verification
Search `Melbourne Beach`, confirm map navigation and marker coordinates, then click another Central Florida point and confirm selection updates.

### UI/UX Verification
Inspect search, results, marker, map controls, keyboard use, touch behavior, empty/loading/error states, and mobile composition.

### Success Criteria
Location is unmistakable; selection paths are fast, accessible, and do not require an account.

### Commit Plan
Likely boundaries: map foundation; geocoding/search; click selection and marker; optional local saved places; tests.

### Stop Condition
Location selection works end to end with no weather functionality started.

## Phase 3 — Live Weather Providers

### Goal
Acquire and normalize the authoritative live inputs required for consumer forecasts.

### Scope
Minimal adapters for NWS and required NOAA observational/model sources, Central Florida subsets, normalized internal types, caching, source timestamps, health status, and graceful partial failure.

### Out of Scope
Radar map rendering, custom nowcasting, ML, and final consumer forecast scoring.

### Deliverables
Server-side provider adapters and inspectable normalized responses using real upstream data.

### Tests
Adapter fixtures, schema normalization, timestamp freshness, caching, malformed responses, timeouts, and partial-provider failures.

### End-to-End Verification
Request live data for representative Central Florida coordinates and verify attribution, freshness, normalized values, caching, and degraded responses.

### UI/UX Verification
Inspect any source-health or reduced-confidence messaging; technical provider details must not dominate the primary UI.

### Success Criteria
Applicable Engineering, Weather/Data, and Git criteria pass; upstream failures do not crash the product.

### Commit Plan
Likely one verified commit per coherent provider/normalization unit, followed by health and degradation handling.

### Stop Condition
Required live inputs are normalized and verified; radar visualization and consumer forecast remain unimplemented.

## Phase 4 — Live Radar

### Goal
Show current, real precipitation and recent movement on the map.

### Scope
Real radar source, Central Florida raster/vector processing as needed, map overlay, recent-frame animation, freshness, legend/intensity treatment, caching, and observed-data labeling.

### Out of Scope
Future extrapolation, storm-cell tracking, uncertainty cones, and ML.

### Deliverables
A performant live radar layer with controllable animation and honest source state.

### Tests
Radar metadata and frame parsing, ordering, freshness, caching, missing frames, animation controls, and reduced-motion behavior.

### End-to-End Verification
Load current radar, animate recent frames, verify source time and recovery from an unavailable frame/source.

### UI/UX Verification
Inspect legibility, intensity semantics, labels, controls, motion, mobile performance, and distinction between radar observations and other map content.

### Success Criteria
Radar is real, current, understandable, and does not obscure the selected location.

### Commit Plan
Likely boundaries: radar adapter/cache; map overlay; animation and controls; failure/accessibility tests.

### Stop Condition
Observed radar works end to end; future projection has not begun.

## Phase 5 — Consumer Forecast

### Goal
Answer the next-hour rain question using honest, provider-derived forecast logic before custom ML exists.

### Scope
Probabilities for `15m`, `30m`, `1h`, `2h`, `6h`; hero 1-hour value; arrival range; intensity; confidence; deterministic Why evidence; source attribution/freshness; forecast history/change UI where current storage permits.

### Out of Scope
Claims of a trained Puddle model, custom radar nowcasting, long-term persistence, and scientific superiority claims.

### Deliverables
Typed forecast API and complete consumer forecast experience with transparent derivation and degraded-confidence behavior.

### Tests
Probability bounds, horizon/time-window handling, confidence rules, arrival formatting, explanation generation, invalid coordinates, stale/missing sources, API contract, and primary UI flows.

### End-to-End Verification
Select multiple locations, load real provider-derived forecasts, change horizons, open Why, inspect sources, and simulate provider degradation.

### UI/UX Verification
Confirm the answer is understood in about five seconds; inspect hierarchy, language, change explanation, mobile layout, loading/errors, and accessibility.

### Success Criteria
The 1-hour answer dominates, uncertainty is honest, all five horizons are clear, and no fake or misrepresented model output exists.

### Commit Plan
Likely boundaries: forecast contract/logic; forecast API; hero and horizons; Why/sources; change and degraded states; tests.

### Stop Condition
The real provider-derived forecast works end to end and is not labeled as custom ML; Phase 6 has not begun.

## Phase 6 — Persistence

### Goal
Persist forecast evidence and history reproducibly with version-controlled database setup.

### Scope
Supabase client, migrations, PostGIS where required, prediction history, normalized source snapshots, verification records, indexes, retention decisions, and saved locations where appropriate.

### Out of Scope
Mandatory authentication, model training, nowcasting, and manual dashboard SQL.

### Deliverables
Automated migrations and typed persistence paths with local setup documentation and no committed secrets.

### Tests
Migration reset, constraints/indexes, timestamp and coordinate handling, persistence round trips, anonymous behavior, and database-unavailable degradation.

### End-to-End Verification
Apply migrations from empty state, create a forecast, retrieve history, attach a verification record, and exercise saved locations if included.

### UI/UX Verification
Inspect saved-place and history states on mobile and desktop, including unavailable-database behavior.

### Success Criteria
Schema is migration-managed, forecast provenance is retained, anonymous forecasts still work, and applicable criteria pass.

### Commit Plan
Likely boundaries: migrations/schema; application data access; forecast history integration; saved locations if included; tests.

### Stop Condition
Persistence works from a clean setup; no ML or nowcasting work has started.

## Phase 7 — Radar Nowcasting

### Goal
Estimate near-term precipitation movement and communicate projected position and uncertainty honestly.

### Scope
Recent-frame motion estimation, useful storm/cell movement features, projected positions through the first hour, uncertainty widening/fading, arrival features, and clear observed-versus-projected labeling.

### Out of Scope
Trained probability model, global radar processing, and deterministic claims of exact arrival.

### Deliverables
Reproducible nowcast outputs and an uncertainty-aware map projection suitable for forecast features.

### Tests
Synthetic motion cases, stationary/growing/decaying rain, frame gaps, coordinate/time alignment, uncertainty growth, and deterministic arrival-feature calculations.

### End-to-End Verification
Run on representative live and recorded events, compare source frames with projections, and verify safe fallback when motion cannot be estimated.

### UI/UX Verification
Users can distinguish NOW from projected frames; inspect motion clarity, uncertainty semantics, controls, reduced motion, and mobile performance.

### Success Criteria
Projection is useful without appearing observational or certain, and failures reduce confidence rather than fabricate motion.

### Commit Plan
Likely boundaries: motion pipeline; feature/arrival calculations; projected map layer; uncertainty and fallback states; tests.

### Stop Condition
Nowcasting is reproducible and integrated; no trained model has been introduced.

## Phase 8 — Historical Dataset + Baselines

### Goal
Create a leakage-safe dataset and honest reference forecasts for evaluating Puddle's hypothesis.

### Scope
Reproducible Central Florida event extraction, as-of timestamp discipline, measurable-rain target definition, verification matching, feature dataset, NWS baseline, HRRR-derived baseline, equal-weight ensemble, and dataset metadata.

### Out of Scope
Custom model selection, production ML inference, and claims of improvement.

### Deliverables
Versioned dataset-building workflow, documented target threshold, baseline outputs, and repeatable evaluation inputs.

### Tests
As-of joins, future-data leakage guards, target windows, missing/late observations, spatial matching, deterministic rebuilds, and baseline probability validity.

### End-to-End Verification
Build a bounded dataset from raw snapshots, reproduce it, run all baselines, and inspect sample provenance from prediction time to outcome.

### UI/UX Verification
Not applicable unless internal evaluation views are added; do not add a dashboard merely for this phase.

### Success Criteria
Every example uses only information available at prediction time and every baseline is reproducible.

### Commit Plan
Likely boundaries: dataset/target pipeline; leakage tests; each coherent baseline family; reproducibility/evaluation runner.

### Stop Condition
Dataset and baselines are verified; no custom model is selected or deployed.

## Phase 9 — Puddle ML Model

### Goal
Train, calibrate, version, and integrate the smallest model that offers defensible value.

### Scope
Logistic regression baseline, evidence-driven XGBoost/LightGBM comparison where practical, feature pipeline, time-aware validation, calibration, serialized model/version metadata, inference adapter, and safe fallback to provider-derived logic.

### Out of Scope
Large neural models, GPU services, LLM forecasting, and unsupported performance claims.

### Deliverables
Reproducible training command, evaluated model artifact, calibrated inference, provenance recording, and production fallback.

### Tests
Feature parity between training/inference, leakage guards, serialization, probability bounds, calibration transform, missing features, model-version recording, and fallback behavior.

### End-to-End Verification
Train from the Phase 8 dataset, reproduce metrics, load the artifact in application inference, and compare live output with fallback behavior.

### UI/UX Verification
Forecast explanations remain evidence-based and consumer-friendly; no AI branding or false certainty is added.

### Success Criteria
Model choice is justified by measured results, probability calibration is recorded, inference is fast, and deterministic fallback works.

### Commit Plan
Likely boundaries: training/feature pipeline; model comparison/calibration; artifact/versioning; inference integration/fallback; tests.

### Stop Condition
The verified model is integrated without claims beyond its evidence; Phase 10 has not begun.

## Phase 10 — Scientific Evaluation

### Goal
Determine truthfully whether Puddle improves exact-location precipitation forecasts.

### Scope
Brier Score, reliability/calibration analysis, log loss and secondary discrimination metrics, arrival-time error, comparisons with NWS/HRRR/equal ensemble, horizon/season/convective-event slices, reproducible reports, and limitations.

### Out of Scope
Metric cherry-picking, marketing claims, unrelated model changes, and hidden unfavorable results.

### Deliverables
A reproducible evaluation command and concise, versioned results artifact explaining data window, sample counts, uncertainty, and limitations.

### Tests
Metric calculations against known examples, grouping/slicing, missing outcomes, reproducibility, and report schema.

### End-to-End Verification
Run evaluation from stored predictions/outcomes and independently reconcile sample counts and representative metric calculations.

### UI/UX Verification
If results are exposed publicly, inspect plain-language accuracy and accessibility; otherwise no product UI is required.

### Success Criteria
Comparisons are apples-to-apples, calibration is visible, and negative or inconclusive results are reported honestly.

### Commit Plan
Likely boundaries: metric library/tests; comparison pipeline; reliability/arrival analyses; final reproducible report.

### Stop Condition
Scientific results and limitations are reproducible; polish work has not begun.

## Phase 11 — UI/UX and Product Polish

### Goal
Refine the complete experience to the PRD's consumer-product quality bar.

### Scope
Mascot refinement, map and forecast-change polish, motion, loading/error/empty states, accessibility, keyboard/touch use, 320px mobile refinement, performance, offline/PWA support only if trivial, and visual consistency.

### Out of Scope
New product categories, activity recommendations, geographic expansion, or architecture rewrites unrelated to measured issues.

### Deliverables
A cohesive, fast, accessible product with final production assets and resolved high-impact UX defects.

### Tests
Critical UI flows, accessibility checks, reduced motion, responsive regressions, error/degraded states, performance budgets, and existing full suite.

### End-to-End Verification
Exercise the complete primary flow and degraded states on representative desktop and mobile browsers and a throttled mobile connection.

### UI/UX Verification
Perform a systematic visual audit of every meaningful state and viewport; compare mascot/design assets with references and refine until faithful.

### Success Criteria
All applicable UI/UX criteria pass; no placeholder asset, generic dashboard pattern, overflow, or blocking accessibility issue remains.

### Commit Plan
Use issue-centered verified commits: accessibility, responsive layout, state polish, mascot/map refinement, and performance as independently working units.

### Stop Condition
The product passes the visual and interaction audit; production deployment/audit remains Phase 12.

## Phase 12 — Production Audit

### Goal
Deploy and verify a clean, real-data Puddle release in production.

### Scope
Vercel deployment, supported CLI-managed environment configuration, production migrations, real endpoints and sources, mobile/browser verification, source-failure tests, security/secret check, performance review, cleanup, rollback readiness, and final criteria audit.

### Out of Scope
Post-MVP features, new geography, speculative scaling, and unrelated redesign.

### Deliverables
Verified production URL, deployment/configuration record without secrets, final test evidence, and concise known limitations.

### Tests
Full automated suite, lint, typecheck, production build, migration verification, production smoke tests, critical browser flows, and controlled source-failure behavior.

### End-to-End Verification
On production: search `Melbourne Beach`, select another map point, inspect real radar/movement, all five forecast horizons, timing, confidence, Why, sources/freshness, change history, and saved place behavior.

### UI/UX Verification
Inspect production on desktop and mobile around 320px, including loading, errors, touch, keyboard, reduced motion, map usability, and mascot assets.

### Success Criteria
Every applicable item in `docs/SUCCESS_CRITERIA.md` passes or has an explicit evidence-backed limitation; production uses real data and the worktree is synchronized.

### Commit Plan
Likely boundaries: deployment configuration; production-found fixes by coherent issue; final cleanup and verification fixes. Push only verified checkpoints.

### Stop Condition
Production is verified, limitations are reported, `main` matches `origin/main`, the worktree is clean, and no post-MVP phase is started.

## Phase 13 — Production ML Forecast

### Goal
Make Puddle's live next-hour forecast use a real trained and calibrated ML model built from live-compatible meteorological features, with safe fallback when required inputs or a valid model are unavailable.

### Scope
Production-safe Central Florida HRRR next-hour precipitation ingestion; one shared training-and-inference feature contract; a materially expanded, leakage-safe historical dataset; chronological model validation and calibration; baseline comparison; explicit model promotion; live forecast API inference; compact provenance persistence; and consumer-friendly forecast-origin messaging.

### Out of Scope
Neural weather foundation models, transformers, GPU inference, distributed processing, queues, Kafka, Redis, new standalone services, Kubernetes, Docker, global atmospheric models, long-range forecasting, continuous retraining infrastructure, and complex MLOps platforms.

### Deliverables
A promoted, reproducible calibrated model artifact that uses only live-compatible features; efficient current HRRR feature retrieval without full-file downloads per request; a live forecast path that returns calibrated Puddle ML probability when all required inputs are fresh and valid; and a transparent provider-derived fallback whenever ML cannot safely run.

### Requirements
- Define exactly one feature schema with names, units, meaning, normalization, requiredness, and freshness rules used by both training and live inference.
- Retrieve the newest usable HRRR run for a selected Central Florida coordinate and extract the same next-hour precipitation window used in training.
- Prefer the smallest useful set of consistently available inputs: HRRR guidance, NWS guidance, supported radar features, nearby observations, and justified time/location features.
- Expand the real historical dataset beyond the prior 57-row candidate with rain and non-rain examples across representative Central Florida conditions; reject rows with unavailable-as-of inputs or leakage.
- Train simple candidates only: logistic regression and at most one lightweight tree-based model already compatible with the repository.
- Validate chronologically, measure raw and calibrated probabilities, and compare Brier score against NWS, HRRR, equal-weight ensemble, and the previous candidate where meaningful.
- Promote an artifact only after feature parity, leakage, calibration, validation, and baseline-improvement checks succeed. Never select an artifact merely because it is newest.
- Preserve existing provider-derived forecasting for every ML failure mode, including missing, malformed, unpromoted, incompatible, or stale model inputs.
- Return forecast origin and model version in the API, and persist compact feature/source-timestamp provenance for ML forecasts.

### Tests
Feature-contract parity, units, normalization, invalid/missing values, current-HRRR parsing and freshness, model loading/promotion rules, deterministic calibrated inference, probability bounds, metadata, provider fallback, persistence provenance, and end-to-end live plus deliberately degraded-source flows.

### End-to-End Verification
For Melbourne Beach and Austin Tindall Sports Complex, use real current sources to resolve the location, acquire HRRR/radar/observation/NWS inputs, validate the feature vector, run a promoted model, return the calibrated probability through the forecast API, render it in the UI, and verify persisted provenance. Then deliberately make one required ML source unavailable and verify a correctly marked provider fallback still renders.

### UI/UX Verification
Keep the primary screen focused on the next-hour probability. Show only subtle provenance in Why or sources (for example, Puddle forecast with a model version, or live weather guidance during fallback); do not expose raw feature vectors or add an ML dashboard.

### Success Criteria
All dedicated Production ML criteria in `docs/SUCCESS_CRITERIA.md` pass. The hero 1-hour probability is a calibrated promoted-model output during successful live inference, fallback remains honest and available, and real current Central Florida verification—not fixtures—proves the complete path.

### Commit Plan
Likely boundaries: documentation; live HRRR ingestion; shared feature contract; expanded training data and validated model; live inference and persistence; tests; and workflow documentation. Each independently working change is verified, committed, and pushed to `origin/main` before continuing.

### Stop Condition
Real current weather flows through fresh live features, a promoted calibrated model, the forecast API, and the consumer UI for Central Florida locations; persistence and fallback have both been verified. If no candidate honestly beats its baseline, do not promote it: retain provider fallback and report the data limitation instead.

## Phase 14 — Forecast Feedback Loop

### Goal
Add an optional, human-in-the-loop forecast verification flow so users can report whether Puddle got the outcome right at the exact location and forecast window they received.

### Scope
Post-window, one-tap feedback with `Yes, it rained`, `No rain here`, and `Not sure`; optional secondary timing and intensity feedback; auditable linkage to the original prediction, location, forecast window, source, and model version; automatic meteorological verification; verification confidence; privacy-preserving storage; and future dataset/evaluation workflows.

### Out of Scope
Immediate online learning, direct production-model updates from user responses, continuous location tracking, surveys, mandatory feedback, and a generic feedback dashboard.

### Requirements
- Offer feedback only after the forecast window expires, keep it optional, and make the primary response a single tap.
- Tie every response to the exact prediction, issue time, window start/end, selected latitude/longitude, forecast source, and model version; reference existing prediction records rather than duplicating data unnecessarily.
- Preserve equivalent fields for the user outcome, optional timing and intensity feedback, automatic outcome, verification confidence, and submission time, using repository naming conventions when implemented.
- Treat feedback as a stored verification signal, not an immediate training signal. A single response must never directly update the live production model.
- Combine human feedback and automatic observations into future training/evaluation datasets through an auditable flow: stored record, evidence reconciliation, candidate training, validation, and promotion only if better.
- Do not call this RLHF; use forecast feedback, human verification, user-reported outcome, or human-labeled verification.
- Store only location information already associated with the forecast. Do not create continuous user-location history solely for feedback.

### Tests
Window-expiration eligibility, one-tap and optional-response behavior, duplicate/idempotent submissions, exact prediction/location/window/provenance linkage, confidence-state derivation, automatic-plus-human reconciliation, disputed and unavailable evidence, privacy/retention constraints, and proof that feedback cannot mutate the live model or bypass promotion.

### End-to-End Verification
Create a real forecast, let its window expire in a controlled test, submit each primary outcome and optional fields, verify the auditable record and provenance, attach automatic observational evidence, and confirm the resulting verification state is available to evaluation without changing live inference. Verify weak or conflicting evidence produces human-only, unknown, or disputed states as appropriate.

### UI/UX Verification
Inspect the expired-window prompt on desktop and mobile, confirm it is clearly optional and not survey-like, verify one-tap completion, readable outcome labels, accessible controls, no location-history implication, and unobtrusive handling of secondary questions.

### Success Criteria
All dedicated Forecast Feedback Loop criteria in `docs/SUCCESS_CRITERIA.md` pass. Feedback is auditable, privacy-minimal, confidence-aware, and useful for future evaluation without directly retraining or changing the live model.

### Commit Plan
Likely boundaries: feedback eligibility and interaction; verification persistence/provenance; observational reconciliation and confidence; evaluation export and safeguards; tests. Each independently working change is verified, committed, and pushed to `origin/main` before continuing.

### Stop Condition
An expired real forecast can receive an optional one-tap report, the report is stored and reconciled with automatic evidence, provenance and confidence are auditable, and no feedback path can directly alter production inference. Do not begin a subsequent phase automatically.
