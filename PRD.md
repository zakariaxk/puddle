# Puddle
## Final Product Requirements Document & Claude Code Build Specification

**Version:** 1.0  
**Product:** AI-assisted hyperlocal precipitation forecasting web application  
**Initial market:** Central Florida  
**Primary platform:** Responsive web application  
**Deployment target:** Vercel  
**Primary database:** Supabase / PostgreSQL + PostGIS  
**Primary goal:** Accurately predict whether rain will hit a user's exact selected location within the next hour.

---

# 1. Executive Summary

**Puddle** is a simple, fast, highly visual weather application focused on answering one question exceptionally well:

> **Is rain actually going to hit where I am?**

Existing weather applications often show broad precipitation probabilities that frequently change throughout the day without explaining why.

For someone deciding whether to:

- play soccer;
- go to the beach;
- go for a run;
- walk a dog;
- golf;
- hold an outdoor event;
- drive somewhere;
- stay outside;

the real question is not:

> “What is today's general weather forecast?”

It is:

> **“Will it rain at this exact place during the next hour?”**

Puddle will combine:

- live radar;
- short-range numerical weather forecasts;
- current observations;
- recent radar movement;
- atmospheric conditions;
- model disagreement;
- historical forecast performance;
- machine learning;

to generate a continuously updated probability that measurable precipitation reaches the user's selected location.

The product must remain extremely simple to use despite sophisticated meteorology underneath it.

The application's primary interaction should be:

**search or click location → immediately understand next-hour rain risk → see where rain is moving → optionally understand why.**

---

# 2. Product Name

# Puddle

Primary brand wording:

> **Know before you go.**

Alternative supporting copy:

> **Know if the rain is actually coming your way.**

The brand should be:

- playful;
- memorable;
- friendly;
- modern;
- slightly quirky;
- trustworthy;
- visually polished;
- not corporate;
- not overly technical;
- not obviously “AI generated.”

Do not name product elements with generic AI terminology unless technically necessary.

Avoid phrases such as:

- AI Forecast Engine;
- SmartWeather AI;
- Weather Intelligence Platform;
- Hyperlocal AI;
- NextGen Weather.

Users should interact with **Puddle**, not with an “AI platform.”

---

# 3. Product Motivation

Puddle is based on a real recurring problem.

Weather applications frequently make outdoor planning frustrating because:

- rain timing moves dramatically throughout the day;
- predicted rain sometimes never reaches the user's location;
- localized Florida storms can affect one neighborhood while completely missing another;
- precipitation probabilities often provide little intuitive context;
- apps rarely explain why their forecast suddenly changed;
- forecast periods can be too broad to help someone planning the next hour.

Central Florida provides an ideal initial environment because of:

- frequent convective thunderstorms;
- highly localized rainfall;
- sea-breeze interactions;
- rapidly developing summer storms;
- abundant weather events for evaluation;
- strong relevance to outdoor activities.

Puddle must be built around solving this specific real-world frustration rather than becoming another general-purpose weather application.

---

# 4. Product Promise

The primary Puddle promise is:

> **The clearest and best-calibrated estimate we can provide of whether rain will hit your exact selected location during the next hour.**

Puddle should primarily optimize for:

### 0–60 minute precipitation prediction.

Secondary horizons:

- 15 minutes;
- 30 minutes;
- 1 hour;
- 2 hours;
- 6 hours.

The first hour is the product.

Everything beyond it is supplementary.

---

# 5. Initial Geographic Scope

Puddle V1 should focus exclusively on:

# Central Florida

Suggested operating region should comfortably include:

- Orlando;
- Kissimmee;
- UCF;
- Lake Nona;
- Winter Park;
- Sanford;
- Clermont;
- Daytona Beach;
- Cocoa Beach;
- Melbourne;
- Melbourne Beach;
- Titusville;
- surrounding Central Florida communities.

Do not architect the initial product around global support.

Build geographic abstractions cleanly enough that additional regions could be added later, but optimize the initial implementation for Central Florida.

---

# 6. Core Product Principle

The system should never present uncertainty as certainty.

Bad:

> It will rain at 5:42 PM.

Better:

> **74% chance of rain within the next hour.**

Best:

> **74% chance of rain**
>
> Most likely arrival: **5:35–6:05 PM**
>
> Confidence: **High**

The distinction between:

- probability;
- confidence;
- expected arrival;

must remain clear.

---

# 7. Primary User Experience

The product should answer six questions immediately:

1. **Will it rain here?**
2. **How likely is it?**
3. **When might it arrive?**
4. **How intense might it be?**
5. **Where is the rain moving?**
6. **Why does Puddle think that?**

The first five should require effectively zero meteorological knowledge.

The sixth should be available through progressive disclosure.

---

# 8. Primary User Flow

## 8.1 Open Puddle

The user opens the web application.

They should immediately see:

- map;
- location search;
- current selected point if available;
- live precipitation visualization;
- primary next-hour prediction.

No onboarding wall.

No dashboard full of widgets.

No account requirement.

---

## 8.2 Select a Location

Users have three equal ways to select somewhere.

### Search

Allow natural location searches such as:

- `Melbourne Beach`
- `UCF`
- `Cocoa Beach Pier`
- `Lake Nona`
- a complete address.

The search should feel forgiving and fast.

---

### Click the Map

Click or tap anywhere.

Drop a clear Puddle location marker.

Immediately calculate the forecast for that coordinate.

---

### Saved Locations

Users should eventually be able to save labels such as:

- Home
- Soccer
- UCF
- Beach
- Work

Authentication should not block the initial forecast experience.

Saved places can initially use browser/local persistence if that materially simplifies V1, with Supabase accounts introduced only where useful.

---

# 9. Forecast Horizons

Puddle should expose exactly:

- **15m**
- **30m**
- **1h**
- **2h**
- **6h**

These should appear as highly scannable controls/cards.

Example:

| 15m | 30m | 1h | 2h | 6h |
|---|---|---|---|---|
| 14% | 31% | **68%** | 54% | 38% |

The **1h value is the hero forecast**.

Do not give all five values equal visual emphasis.

---

# 10. Hero Forecast

For any selected location, the dominant UI should communicate something like:

## 68%

**Rain chance in the next hour**

Likely:

**5:35–6:05 PM**

Confidence:

**High**

The interface should be understandable within approximately five seconds.

---

# 11. Consumer Language

Puddle should avoid meteorological jargon in the default experience.

Instead of:

> Convective reflectivity increased along a southwest boundary.

Say:

> **A storm southwest of you is strengthening and moving your way.**

Instead of:

> Model ensemble divergence has increased.

Say:

> **Forecasts disagree more than usual, so confidence is lower.**

Technical values may appear inside advanced details but not in the main experience.

---

# 12. “Why?” Experience

The default product is consumer-first.

Technical explanation should sit behind a simple:

# Why?

Opening it should provide a concise explanation.

Example:

## Why we're saying 68%

**Rain is approaching from the southwest**  
Strong influence

**The storm has strengthened recently**  
Moderate influence

**HRRR expects rain near your location**  
Moderate influence

**Another model keeps the strongest rain north of you**  
Small negative influence

**Model agreement**  
High

---

## Sources

Clearly list relevant data providers such as:

- NOAA MRMS;
- NOAA HRRR;
- National Weather Service;
- ECMWF where integrated.

Each source should show:

- provider;
- dataset/model;
- freshness/update time where possible.

Example:

> NOAA MRMS Radar  
> Updated 3 minutes ago

This provides transparency and credibility.

---

# 13. “Why Did This Change?”

This is a major product differentiator.

If probability changes materially:

Example:

> **68%**
>
> ↑ 21% in the last 20 minutes

Allow:

# Why did this change?

Example explanation:

> A storm west of Orlando strengthened over the last 20 minutes and its projected path shifted closer to your location.

This is significantly more useful than silently changing a precipitation percentage.

Store enough forecast history to support this interaction.

---

# 14. Map Experience

The map is not decorative.

The map is the main visualization for understanding Puddle.

It should clearly communicate:

- where precipitation currently is;
- where the selected location is;
- direction precipitation is moving;
- approximate future precipitation position;
- uncertainty.

---

# 15. Map Requirements

## 15.1 Base Map

Use a clean mapping solution such as:

**MapLibre GL JS**

Avoid a visually noisy map.

Weather information should remain dominant.

---

## 15.2 Selected Point

The selected location must be visually obvious.

A custom Puddle marker should display or connect naturally to the current probability.

Conceptually:

```text
      72%
       │
       ●
```

The marker should feel branded rather than looking like a default Google Maps pin.

---

# 16. Radar Layer

Display current precipitation visually.

Radar should:

- animate smoothly;
- update automatically;
- be understandable;
- avoid overpowering location labels;
- clearly distinguish light vs stronger precipitation.

If official radar palettes are too visually aggressive, carefully adapt their presentation without misleading users about intensity.

---

# 17. Radar Motion

Puddle should show motion instead of presenting radar as a static image.

Potential representations:

- animated historical frames;
- subtle directional vectors;
- projected future precipitation positions;
- motion trail;
- uncertainty cone.

The user should intuitively understand:

> **That rain is going this direction.**

---

# 18. Forecast Projection Layer

Potential near-term forecast visualization:

```text
NOW      +15m       +30m       +45m

████     ▓▓▓▓       ▒▒▒▒       ░░░░
```

Projected future precipitation should become visually less certain with time.

Do not present extrapolated radar as observational truth.

Clearly differentiate:

- observed;
- projected.

---

# 19. Uncertainty Visualization

Avoid drawing exact future storm boundaries as if they are guaranteed.

Potential visual solution:

### Forecast cone / fuzzy projected region

As prediction horizon increases:

- boundary becomes softer;
- opacity decreases;
- possible track widens.

This gives users an intuitive understanding of uncertainty.

---

# 20. UI/UX Is a First-Class Requirement

# This is extremely important.

Puddle should **not** look like a generated developer dashboard.

UI/UX quality is part of the product itself.

Claude should spend substantial implementation attention on:

- hierarchy;
- spacing;
- typography;
- motion;
- responsiveness;
- empty states;
- loading states;
- touch interactions;
- transitions;
- map controls;
- mobile layout;
- perceived speed;
- accessibility;
- personality;
- visual consistency.

A technically sophisticated backend with mediocre UI is not considered successful.

---

# 21. UI Design Philosophy

The desired aesthetic is:

**playful meteorology + premium consumer app**

Reference qualities:

- Apple Weather simplicity;
- Linear-level polish;
- modern map application fluidity;
- subtle personality;
- restrained animation;
- approachable illustrations.

Do not directly clone those products.

Use them as quality references.

---

# 22. Avoid Generic AI UI

Explicitly avoid the standard AI-generated web design appearance.

Do not default to:

- giant gradient hero;
- purple/blue glowing cards;
- excessive glassmorphism;
- dozens of rounded dashboard cards;
- meaningless statistics;
- generic Lucide icons everywhere;
- “AI-powered” badges;
- excessive pill components;
- fake charts;
- neon gradients;
- generic SaaS landing-page composition.

Puddle should feel intentionally art-directed.

---

# 23. Visual Hierarchy

The primary hierarchy should be:

### 1. Location

Where are we predicting?

### 2. Next-hour probability

What is the answer?

### 3. Map/radar

What is happening spatially?

### 4. Arrival window

When?

### 5. Other forecast horizons

What happens afterward?

### 6. Why?

Why does Puddle believe this?

Everything else is secondary.

---

# 24. Responsive Design

Puddle must work extremely well on:

- desktop;
- laptop;
- tablet;
- mobile browser.

Even though V1 is a web app, the mobile experience should feel app-like.

Many real Puddle use cases occur outside:

- soccer field;
- beach;
- park;
- golf course;
- sidewalk;
- car.

Mobile cannot be treated as a scaled-down desktop dashboard.

---

# 25. Suggested Mobile Composition

Top:

```text
Where are you?
[ Melbourne Beach                  ]
```

Then:

```text
72%

Rain likely in the next hour

5:35–6:05
```

Then large map.

Then:

```text
15m    30m    1h    2h    6h
18%    42%    72%   61%   39%
```

Then:

```text
Why?
```

Map should receive substantial screen space.

---

# 26. Motion Design

Animations should explain state, not decorate it.

Useful motion:

- map flying to searched place;
- radar frame transitions;
- forecast projection;
- probability number transitions;
- “forecast changed” indicator;
- expandable Why panel;
- mascot reactions;
- loading state.

Avoid constant floating/bouncing animation.

Respect reduced-motion accessibility preferences.

---

# 27. Puddle Mascot

# Puddle needs an original app mascot.

This is a product requirement, not an optional extra.

The mascot should make Puddle recognizable and help communicate forecast states.

Potential direction:

### A small expressive water droplet / puddle creature.

Personality:

- curious;
- slightly mischievous;
- friendly;
- expressive;
- not childish;
- visually simple;
- easy to animate;
- recognizable at favicon size.

It should not look like:

- Microsoft Clippy;
- generic emoji;
- generic cloud icon;
- weather-channel mascot;
- stock illustration;
- obvious AI-generated clip art.

---

# 28. Mascot States

Potential emotional states:

### Clear

Happy / relaxed.

### Low rain chance

Content / confident.

### Rain approaching

Concerned / holding tiny umbrella.

### Heavy rain

Slightly overwhelmed.

### Low confidence

Thinking / unsure.

### Data loading

Looking upward / watching clouds.

### Error

Tiny confused expression.

These should be subtle.

Do not turn Puddle into a children's application.

---

# 29. Mascot Usage

Possible placements:

- favicon/app icon;
- empty state;
- loading state;
- forecast summary;
- About page;
- first visit;
- error state.

The mascot should not occupy major map space during normal use.

---

# 30. Mascot Implementation Requirement

Claude should create/recreate the mascot as production assets rather than leaving a placeholder.

Use the strongest available design/image-generation capability or design skill in the environment to first establish the visual concept.

Then convert/recreate the approved visual language appropriately inside the application.

Possible production forms:

- SVG;
- CSS illustration;
- optimized image assets;
- lightweight animation.

If provided with generated/reference designs, Claude should inspect them carefully and reproduce their:

- proportions;
- expression;
- visual style;
- line treatment;
- shape language;
- palette;
- spacing;

rather than substituting a generic icon.

---

# 31. Design Reconstruction Requirement

Claude should actively use any available:

- frontend-design skills;
- UI skills;
- image/design generation tools;
- screenshot/reference inspection tools;
- design-system skills;

when they improve the implementation.

If a visual reference, generated mockup, mascot, or design is available:

# Recreate the actual design in code.

Do not simply describe it.

Do not replace it with a generic approximation when a faithful recreation is feasible.

The expected workflow should be:

1. inspect visual reference;
2. identify layout/design tokens;
3. identify typography;
4. identify spacing system;
5. identify shapes and effects;
6. implement them in code;
7. render application;
8. compare rendered result to reference;
9. refine until visually close.

This applies especially to:

- map overlays;
- probability cards;
- mascot;
- location marker;
- mobile bottom sheet;
- Why panel.

---

# 32. Design System

Claude should establish a small coherent internal design system.

Define:

### Typography

- primary display style;
- body;
- metadata;
- numerical forecast typography.

The rain percentage deserves highly optimized numerical typography.

---

### Color

Brand palette should reference:

- water;
- sky;
- rain;
- Florida outdoors;

without becoming a predictable blue gradient product.

Colors must also support weather semantics.

For example:

- low probability;
- moderate;
- likely;
- high confidence;
- warning.

Accessibility/contrast must remain correct.

---

### Radius

Use intentionally rather than giving every object the same huge rounded radius.

---

### Spacing

Use consistent spacing tokens.

---

### Elevation

Minimal.

Map overlays should remain visually legible without excessive shadow.

---

# 33. Product Performance

Puddle should feel fast.

Targets:

### Initial UI

Meaningful content shell available immediately.

### Location search

Results should feel near-instant when cached.

### Existing cached forecast

Return quickly.

### New forecast

Ideally only hundreds of milliseconds beyond source retrieval/caching.

### ML inference

Should be effectively negligible.

Performance matters particularly on mobile connections.

---

# 34. PWA Consideration

If trivial to support cleanly, configure Puddle as an installable Progressive Web App.

Possible benefits:

- home-screen icon;
- standalone feel;
- faster repeat usage.

Do not allow PWA implementation to delay core functionality.

---

# 35. Technical Architecture

Keep architecture deliberately simple.

```text
                    User
                      │
                      ▼
             Next.js Web App
                  Vercel
                      │
          ┌───────────┼───────────┐
          │           │           │
          ▼           ▼           ▼
      Map UI      API Routes    Search
          │           │
          │           ▼
          │     Forecast Engine
          │           │
          │    ┌──────┼───────────┐
          │    ▼      ▼           ▼
          │   NOAA   NWS       ECMWF
          │   MRMS   HRRR      optional
          │    │      │           │
          │    └──────┼───────────┘
          │           ▼
          │     Feature Engine
          │           │
          │           ▼
          │       ML Model
          │           │
          └───────────┤
                      ▼
                  Supabase
              PostgreSQL/PostGIS
```

---

# 36. Infrastructure Philosophy

Primary goals:

- free;
- simple;
- reproducible;
- automated;
- few services;
- easy for Claude Code to operate.

Avoid:

- Kubernetes;
- microservices;
- Redis unless proven necessary;
- message queues;
- dedicated GPU servers;
- multiple backend hosts;
- expensive weather APIs;
- premature infrastructure.

---

# 37. Hosting

## Frontend

**Vercel**

Use:

- Next.js;
- TypeScript;
- server/API routes where appropriate.

---

# 38. Backend

Do not introduce a traditional always-running backend unless required.

Use primarily:

### Vercel Functions / Next.js server routes

for:

- forecast requests;
- location geocoding;
- data aggregation;
- source adapters;
- model inference;
- explanation generation.

Python may be used when valuable for the ML/inference portion.

Keep deployment as close to one Vercel project as possible.

---

# 39. Database

Use:

# Supabase PostgreSQL

Enable:

# PostGIS

Store:

- selected/saved places;
- normalized observations;
- model forecasts;
- generated Puddle forecasts;
- historical prediction snapshots;
- eventual observed outcomes;
- evaluation metrics.

---

# 40. No Manual Database Setup

All schema changes must be version-controlled migrations.

Claude must create:

```text
supabase/
  migrations/
```

Running setup should automatically create:

- extensions;
- tables;
- indexes;
- functions;
- scheduled jobs where supported;
- development seed data.

Do not require manual SQL copying through the Supabase dashboard.

---

# 41. Authentication

Authentication is not a V1 dependency for receiving weather forecasts.

Anonymous visitors should immediately use Puddle.

If accounts are implemented:

Use Supabase Auth.

Keep sign-in optional.

Primary value before authentication:

- select place;
- inspect map;
- receive prediction.

---

# 42. Geocoding

Support searches such as:

```text
Melbourne Beach
```

and complete addresses.

Use an open geocoding provider suitable for development.

Cache normalized location results aggressively.

Return:

```json
{
  "name": "Melbourne Beach, FL",
  "latitude": 28.0683,
  "longitude": -80.5603
}
```

Never continuously call public geocoding endpoints unnecessarily.

---

# 43. Weather Data Sources

Prioritize authoritative/open data.

Potential V1 sources:

## NOAA MRMS

Use for radar-derived precipitation and real-time precipitation location/intensity.

---

## NOAA HRRR

Primary short-range numerical forecast input.

Important for:

- precipitation;
- convection;
- humidity;
- wind;
- instability;
- short-term timing.

---

## National Weather Service

Use:

- forecast;
- observations;
- alerts where relevant.

Can also serve as an evaluation/reference forecast.

---

## Surface Observations

Potential sources:

- ASOS;
- METAR;
- NWS observation stations.

Features may include:

- temperature;
- humidity;
- dew point;
- pressure;
- wind;
- precipitation.

---

## ECMWF

Integrate only if practical under free/open access constraints.

Potential inputs:

- IFS;
- AIFS.

Do not let difficult ECMWF ingestion prevent the working MVP.

---

# 44. Weather Data Adapter Layer

Each data provider should have a clean adapter.

Example:

```text
weather/
  providers/
    nws.ts
    hrrr.ts
    mrms.ts
    ecmwf.ts
```

or corresponding Python modules where appropriate.

Normalize provider-specific formats into Puddle's internal representations.

No provider-specific logic scattered throughout UI code.

---

# 45. Weather Data Strategy

Do not ingest enormous atmospheric datasets unnecessarily.

For V1:

- Central Florida only;
- required variables only;
- short horizons only;
- cache aggressively;
- process only useful geographic subsets.

Avoid:

- archiving every HRRR variable;
- global model downloads;
- every forecast hour;
- massive GRIB storage without purpose.

---

# 46. ML Problem Definition

Puddle is NOT attempting:

> Predict the entire future atmosphere.

The initial ML objective is:

> **Estimate the probability that measurable precipitation will reach coordinate X during time window T using the information available now.**

Target horizons:

- +15m;
- +30m;
- +60m;
- +2h;
- +6h.

Primary model optimized for:

# +60 minutes.

---

# 47. Target Variable

For a location/time window:

```text
rain = 1
```

if measurable precipitation occurs during the target window.

Otherwise:

```text
rain = 0
```

Threshold must be explicitly defined and consistent.

---

# 48. Candidate Features

## Radar Features

- nearest precipitation distance;
- reflectivity/intensity;
- direction relative to user;
- estimated speed;
- heading;
- strengthening;
- weakening;
- projected path intersection;
- nearby cell area.

---

## Atmospheric Features

- temperature;
- dew point;
- humidity;
- wind speed;
- wind direction;
- pressure;
- CAPE;
- CIN;
- precipitable water where available.

---

## Model Features

For each forecast source:

- precipitation probability;
- precipitation amount;
- convective signal;
- timing;
- relevant atmospheric variables.

---

## Temporal Features

- hour;
- month;
- season;
- day-of-year;
- sunrise/sunset proximity.

---

## Spatial Features

- latitude;
- longitude;
- elevation if helpful;
- distance to Atlantic coast;
- distance to Gulf influence where appropriate;
- land/water context.

Do not manually encode meteorological assumptions unless evidence supports them.

---

# 49. Initial ML Model

Start simple.

Candidate models:

1. Logistic regression baseline.
2. XGBoost.
3. LightGBM.

Do not begin with:

- transformer;
- giant neural network;
- custom foundation model;
- GPU requirement.

The smallest model that performs well is preferred.

---

# 50. ML Ensemble Concept

Conceptually:

```text
Puddle =
    ML(
        HRRR,
        NWS,
        radar,
        observations,
        recent storm movement,
        model disagreement,
        historical error
    )
```

The model learns how much trust to place in different signals under different conditions.

---

# 51. Probability Calibration

This is critical.

If Puddle predicts:

```text
70%
```

over many comparable forecasts, roughly 70% should verify as rain.

Evaluate:

- Brier Score;
- reliability diagrams;
- calibration error;
- log loss;
- ROC-AUC as secondary;
- arrival-time MAE where applicable.

Do not market “accuracy” based only on classification accuracy.

---

# 52. Baselines

Puddle must benchmark against real alternatives.

Minimum comparison:

### Baseline A

NWS forecast.

### Baseline B

HRRR-derived forecast.

### Baseline C

simple equal-weight ensemble.

### Model D

Puddle ML.

The objective is to determine whether Puddle truly improves short-term calibration.

---

# 53. Forecast History

Every Puddle prediction should store:

```text
prediction_created_at
target_start
target_end
latitude
longitude
probability
confidence
input_versions
model_version
```

Later attach:

```text
actual_precipitation
rain_observed
verification_time
```

This enables honest evaluation.

---

# 54. Avoid Data Leakage

Training examples may only use information available at prediction time.

Never accidentally include:

- future radar frames;
- later model runs;
- revised observations;
- future station data.

Build explicit timestamp discipline into the data pipeline.

---

# 55. Radar Nowcasting

Radar nowcasting is a major part of the eventual advantage.

Initial approach:

Use several recent radar frames.

Estimate movement.

Possible V1 technique:

- optical flow;
- cell tracking;
- simple motion vectors.

Projected precipitation:

```text
+15m
+30m
+45m
+60m
```

---

# 56. Radar Cell Tracking

A later but valuable improvement:

Detect contiguous precipitation cells.

For each:

```text
centroid
area
intensity
velocity
heading
growth
decay
```

Track them over time.

Compute:

```text
distance_to_user
distance_to_projected_track
estimated_arrival
```

These become excellent model features.

---

# 57. Confidence Score

Probability and confidence are separate.

Confidence can use:

- forecast horizon;
- model agreement;
- radar data availability;
- observation freshness;
- storm predictability;
- historical performance in similar conditions.

Example:

> Rain probability: **63%**
>
> Confidence: **Low**

Meaning:

The rain outcome is uncertain and model agreement is poor.

---

# 58. Forecast Explanation

Puddle's explanation should be generated from structured forecast evidence.

Prefer deterministic/template-driven explanations initially.

Example structured evidence:

```json
{
  "probability": 0.68,
  "storm_direction": "southwest",
  "storm_distance_miles": 14,
  "storm_strengthening": true,
  "hrrr_support": "strong",
  "model_agreement": "high"
}
```

Presentation:

> A storm southwest of you is moving toward your location and has strengthened over the last 20 minutes. Short-range model guidance also supports rain.

An LLM may improve phrasing later.

---

# 59. LLM Rule

# The LLM does not determine the weather forecast.

It may:

- explain;
- summarize;
- translate meteorological information into plain English.

It must not invent:

- probabilities;
- arrival times;
- precipitation intensity;
- meteorological observations.

All values come from deterministic/model outputs.

---

# 60. API Design

Suggested API surface:

```text
GET /api/location/search?q=
```

---

```text
GET /api/forecast?lat=&lon=
```

Response includes:

- 15m probability;
- 30m probability;
- 1h probability;
- 2h probability;
- 6h probability;
- arrival window;
- expected intensity;
- confidence;
- source freshness.

---

```text
GET /api/forecast/history?lat=&lon=
```

Used for:

- recent probability changes;
- “Why did this change?”

---

```text
GET /api/radar
```

---

```text
GET /api/sources
```

---

# 61. Example Forecast Response

```json
{
  "location": {
    "name": "Melbourne Beach, FL",
    "latitude": 28.0683,
    "longitude": -80.5603
  },
  "forecast": {
    "15m": 0.18,
    "30m": 0.41,
    "1h": 0.72,
    "2h": 0.61,
    "6h": 0.39
  },
  "arrival": {
    "start": "17:35",
    "end": "18:05"
  },
  "confidence": "high",
  "intensity": "moderate",
  "change": {
    "previous_probability": 0.51,
    "minutes_ago": 20
  },
  "reasons": [],
  "sources": []
}
```

---

# 62. Suggested Database Schema

## locations

```text
id
name
latitude
longitude
created_at
```

---

## observations

```text
id
observed_at
latitude
longitude
temperature
humidity
dew_point
pressure
wind_speed
wind_direction
precipitation
source
```

---

## source_forecasts

```text
id
provider
model
model_run_at
forecast_for
latitude
longitude
precipitation
precip_probability
raw_metadata
```

---

## puddle_predictions

```text
id
created_at
forecast_for
latitude
longitude
horizon_minutes
probability
confidence
model_version
```

---

## forecast_verifications

```text
id
prediction_id
actual_precipitation
rain_observed
verified_at
```

---

## saved_locations

```text
id
user_id
name
latitude
longitude
created_at
```

---

# 63. Caching

Weather data changes less frequently than users request it.

Do not re-fetch identical upstream data per user.

Cache by:

```text
provider
model_run
region/grid
time
```

Then compute user-specific output from cached meteorological data.

---

# 64. Scheduled Data Collection

Use scheduled jobs where available.

Desired cadence depends on source freshness.

Conceptual:

### Radar

Several-minute cadence.

### Surface observations

Several-minute cadence where available.

### HRRR

On new model runs.

### Other models

On release.

### Verification

Periodically match expired forecasts against observed precipitation.

Do not depend on Vercel Hobby cron capabilities for high-frequency ingestion if the platform limits them.

Prefer Supabase/Postgres scheduling or another free-compatible mechanism.

---

# 65. Zero-Cost Goal

V1 should target a $0 recurring infrastructure cost.

Preferred stack:

### Vercel

Frontend + API.

### Supabase Free

Database + PostGIS + optional Auth.

### MapLibre

Open-source map renderer.

### Open geographic data

Where practical.

### NOAA/NWS

Open meteorological data.

### Small local ML model

No paid inference server.

Avoid requiring:

- Mapbox paid plan;
- OpenAI API for core forecasts;
- commercial weather API;
- dedicated server;
- paid GPU.

If a dependency makes the free architecture impossible, replace it where practical.

---

# 66. Development Philosophy

Keep Puddle:

- small;
- understandable;
- testable;
- observable;
- maintainable.

No unnecessary abstractions.

No enterprise architecture.

No premature scaling.

---

# 67. Repository Structure

Suggested:

```text
puddle/
│
├── app/
│   ├── api/
│   ├── components/
│   ├── forecast/
│   └── map/
│
├── components/
│   ├── map/
│   ├── forecast/
│   ├── mascot/
│   └── ui/
│
├── lib/
│   ├── weather/
│   ├── forecast/
│   ├── geocoding/
│   ├── db/
│   └── map/
│
├── ml/
│   ├── datasets/
│   ├── features/
│   ├── training/
│   ├── models/
│   └── evaluation/
│
├── public/
│   ├── mascot/
│   └── icons/
│
├── supabase/
│   └── migrations/
│
├── scripts/
├── tests/
│
├── CLAUDE.md
├── README.md
└── package.json
```

Adjust if a simpler organization emerges.

Do not create files/directories solely to satisfy this example.

---

# 68. Claude Code Autonomy Requirement

# The project must be built so Claude Code can set it up end-to-end.

The user does not want a long sequence of manual setup instructions.

Claude should handle automatically wherever technically possible:

1. inspect repository;
2. initialize project;
3. install dependencies;
4. configure TypeScript;
5. configure Next.js;
6. configure MapLibre;
7. configure Supabase client;
8. create migrations;
9. enable required Postgres extensions;
10. create database schema;
11. create source adapters;
12. create map;
13. create geocoder;
14. create forecast APIs;
15. implement forecast logic;
16. build UI;
17. implement mascot assets;
18. create tests;
19. run lint;
20. run type checking;
21. run tests;
22. run production build;
23. fix failures;
24. initialize Git if necessary;
25. create sensible commits;
26. deploy to Vercel;
27. configure environment variables through supported CLI tooling;
28. verify deployed endpoints;
29. verify rendered production UI.

The user should not be asked to manually create tables, copy SQL, or click through dashboards when CLI/API automation exists.

---

# 69. Allowed Manual Intervention

Some one-time actions may genuinely require the user, primarily:

- authentication;
- connecting accounts;
- accepting service terms;
- granting permissions;
- providing required secrets.

Claude should minimize these.

If interaction is unavoidable:

1. clearly state the single required action;
2. wait for completion only where technically required;
3. immediately resume automation;
4. never convert one unavoidable manual action into ten unnecessary ones.

---

# 70. Environment Variables

Create:

```text
.env.example
```

Use descriptive keys.

Claude should populate/configure deployment variables automatically when authenticated tooling allows it.

Never commit secrets.

---

# 71. CLAUDE.md

Create a strong repository-level `CLAUDE.md`.

It should explain:

- product vision;
- V1 scope;
- design requirements;
- architecture;
- source-of-truth directories;
- commands;
- testing expectations;
- migration policy;
- UI requirements;
- no-overengineering rule;
- mascot requirement;
- weather-data correctness constraints.

This allows future Claude sessions to understand the project immediately.

---

# 72. Required Development Commands

Prefer a tiny predictable command surface.

Examples:

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

Additional setup scripts can include:

```bash
npm run db:setup
npm run verify
```

If multiple languages are needed, wrap workflow through scripts where sensible.

---

# 73. Testing

Tests must cover meaningful behavior.

## Unit

- probability transformations;
- feature calculations;
- source normalization;
- geocoding normalization;
- time-window handling.

## API

- forecast endpoint;
- invalid coordinates;
- source failure;
- stale source handling.

## UI

- selecting location;
- searching location;
- changing horizon;
- opening Why;
- mobile layout;
- map click.

## Data

- no future data leakage;
- timestamps;
- forecast verification.

---

# 74. Failure Handling

Puddle must degrade gracefully.

If one provider fails:

> Forecast available with reduced confidence.

Do not crash entire forecast.

Source health should influence confidence.

If radar is unavailable:

> Live radar is temporarily unavailable. Forecast is using model guidance and observations.

---

# 75. Loading UX

Never present a generic full-screen spinner if useful UI can already render.

Use:

- map skeleton;
- subtle Puddle mascot state;
- progressive loading;
- cached forecast.

Example:

> Puddle is checking what's headed your way…

Mascot may look toward the sky.

---

# 76. Error UX

Human language only.

Bad:

> Failed to fetch /api/model/mrms 503.

Good:

> **Radar is being stubborn.**
>
> We can still estimate your rain chance using the other live sources.

Technical details can go to logs.

---

# 77. Outdoor Activity Layer — Post-MVP

After the core forecast works, add:

**What are you trying to do?**

Potential choices:

- ⚽ Soccer
- 🏖 Beach
- 🏃 Run
- 🐕 Walk
- ⛳ Golf
- 🌤 Just checking

Puddle can transform forecast data into a decision.

Example:

## Soccer

**I'd play.**

Rain chance next hour:

**18%**

Best window:

**Now–6:15 PM**

This is not part of the critical first implementation.

---

# 78. Future Product Opportunities

Only after V1 validation:

- outdoor activity recommendations;
- push notifications;
- saved-place alerts;
- rain-arrival notifications;
- lightning;
- severe-weather context;
- beach conditions;
- hourly recommendation windows;
- expanded geography;
- native app;
- personalized model weighting.

---

# 79. Non-Goals

Do NOT build in V1:

- worldwide weather;
- hurricanes;
- tornado prediction;
- official severe warning replacement;
- 10-day forecast UI;
- social network;
- chat interface;
- expensive foundation model;
- complex user profiles;
- microservices;
- Kubernetes;
- custom global numerical weather model.

---

# 80. Safety

Puddle is an experimental forecast product.

If severe weather alerts are integrated, official alerts must remain clearly attributed.

Puddle should never imply that it replaces:

- NOAA;
- National Weather Service alerts;
- emergency guidance.

---

# 81. Analytics

Keep analytics privacy-conscious and optional.

Useful anonymous product metrics:

- search initiated;
- map location selected;
- Why opened;
- horizon changed;
- forecast loaded;
- forecast error.

Do not let analytics implementation block MVP.

---

# 82. Accessibility

Minimum expectations:

- keyboard navigation;
- adequate contrast;
- screen-reader labels;
- map controls accessible where possible;
- reduced-motion support;
- touch targets large enough on mobile;
- information not conveyed by color alone.

---

# 83. SEO / Landing Behavior

Puddle's root product should function immediately.

Avoid placing a giant marketing landing page before the forecast.

Minimal introductory branding is sufficient.

Users should reach the actual product instantly.

---

# 84. Initial Screen Definition

The first production screen should approximately contain:

```text
puddle mascot/logo

Where are you going?
[ Search a place or address ]

saved places if available

--------------------------------

interactive weather map

selected location marker
live rain
rain movement

--------------------------------

Melbourne Beach

            72%

   Rain likely next hour

      5:35–6:05 PM

15m    30m     1h     2h     6h
18%    41%     72%    61%    39%

Confidence: High

Why?
```

The actual composition should be refined by proper UI/UX judgment rather than copied mechanically.

---

# 85. Product Personality

Puddle copy can occasionally be playful.

Examples:

### Clear

> **You're probably good.**
>
> Only 12% rain risk this hour.

### Rain incoming

> **You might get soggy.**
>
> Rain is moving your way.

### Uncertain

> **This one's messy.**
>
> Forecasts disagree, so confidence is lower.

Keep humor occasional.

Never let playful copy obscure important information.

---

# 86. Definition of MVP Done

Puddle V1 is complete when a user can:

- open deployed app;
- search `Melbourne Beach`;
- have map navigate there;
- click another point manually;
- see current radar/weather visualization;
- see precipitation movement;
- receive 15m prediction;
- receive 30m prediction;
- receive 1h prediction;
- receive 2h prediction;
- receive 6h prediction;
- see confidence;
- see likely rain timing;
- open Why;
- see underlying data sources;
- see source freshness;
- understand a meaningful forecast change;
- save a location;
- use the experience cleanly on mobile.

And technically:

- weather source adapters work;
- data is normalized;
- predictions are persisted;
- verification pipeline exists;
- evaluation can compare Puddle against baseline;
- database schema is migration-managed;
- build passes;
- tests pass;
- app is deployed;
- production deployment is verified.

---

# 87. Scientific Definition of Success

The UI is not evidence that Puddle predicts weather better.

Puddle's central hypothesis must be measurable.

## Hypothesis

> Combining short-range forecast guidance, live radar evolution, current observations, and learned historical bias can improve next-hour precipitation probabilities for exact locations in Central Florida.

Evaluation must answer whether this is true.

Primary metric:

# Brier Score

Compare:

- Puddle;
- NWS;
- HRRR;
- simple ensemble.

Also track:

- calibration;
- rain arrival error;
- performance by forecast horizon;
- performance by season;
- performance during convective events.

If Puddle initially does not outperform a baseline, report that truthfully and iterate.

---

# 88. Demonstration Goal

The ideal demonstration:

User selects:

> Soccer field

Existing forecast:

> 40% chance of rain.

Puddle:

> **72% in the next hour**
>
> Likely arrival: **5:35–6:05 PM**
>
> A strengthening storm southwest of you is moving northeast toward your location.

The map visibly shows:

- current precipitation;
- movement;
- projected path;
- selected soccer field.

Then Puddle records what actually happens.

The point of the demonstration is not a lucky prediction.

The point is that repeated forecasts can later be quantitatively evaluated.

---

# 89. Build Priorities

Claude should implement in this order unless repository constraints materially justify a different sequence.

## Phase 1 — Product Shell

- Next.js;
- responsive layout;
- visual system;
- map;
- search;
- location selection;
- mascot foundation.

## Phase 2 — Real Weather Data

- source adapters;
- current weather;
- radar;
- source timestamps.

## Phase 3 — Forecast UX

- forecast horizons;
- arrival;
- confidence;
- Why panel;
- history/change UI.

## Phase 4 — Radar Movement

- historical animation;
- simple nowcasting/projection.

## Phase 5 — Persistence

- Supabase;
- prediction storage;
- source snapshots;
- saved places.

## Phase 6 — Baseline ML

- dataset;
- baseline model;
- model inference;
- calibration.

## Phase 7 — Evaluation

- outcome verification;
- Brier score;
- baseline comparison.

## Phase 8 — Polish

- mobile refinement;
- mascot refinement;
- animation;
- accessibility;
- edge cases;
- production optimization.

---

# 90. Implementation Quality Bar

Claude should not stop when:

> The functionality technically works.

Before declaring the project finished:

### UX

- inspect desktop;
- inspect mobile;
- validate loading;
- validate errors;
- validate map usability.

### Visual

- compare implementation against design direction;
- remove generic/generated-looking components;
- refine spacing;
- refine typography;
- refine motion;
- refine mascot.

### Engineering

- lint passes;
- type checking passes;
- tests pass;
- production build passes.

### Integration

- real upstream weather data works;
- no obvious hardcoded demo forecast;
- database persistence works;
- production URLs work.

### Deployment

- deploy to Vercel;
- inspect production result;
- test key workflows against deployed build.

---

# 91. Hard Rule: No Fake Data in Finished Product

Mock data may be used during development.

Final MVP must clearly use real upstream meteorological data for real forecasts.

No hidden:

```text
Math.random()
```

No static:

```text
rainChance = 72
```

No fake radar.

Any fallback demo data must be explicitly marked as simulated and removed from production default behavior.

---

# 92. Hard Rule: Do Not Overengineer

Whenever choosing between:

### Option A

A small understandable implementation that supports V1.

### Option B

A sophisticated architecture designed for hypothetical millions of users.

Choose:

# Option A.

Optimize for:

- one developer;
- free infrastructure;
- strong demo;
- real scientific validation;
- excellent UX.

---

# 93. Hard Rule: Do Not Sacrifice UI/UX

Do not treat styling as the final ten percent.

UI should be developed alongside functionality.

For every major feature, ask:

> How does the user understand this immediately?

Forecasting is inherently uncertain and complicated.

Puddle succeeds if it makes that complexity feel simple without misrepresenting it.

---

# 94. Hard Rule: Use Available Design Skills

When implementing UI:

- discover available design/frontend skills;
- use them;
- use visual references when useful;
- generate/review mascot concepts;
- translate designs into real code;
- render and inspect results.

Do not assume a generic Tailwind layout is sufficient.

When a reference design is created:

# treat it like a design specification.

Reproduce it faithfully in code.

---

# 95. Final Product North Star

A person should be standing at a soccer field in Central Florida, pull out their phone, open Puddle, and within five seconds understand:

> **Can we safely get another hour of soccer in before the rain gets here?**

The technology underneath Puddle can become sophisticated.

The user experience should never feel sophisticated.

It should feel obvious.

---

# 96. Claude Code Final Instruction

You are responsible for turning this PRD into a working product, not merely generating an implementation plan.

Work autonomously.

Inspect the environment and available skills/tools before deciding that something requires manual work.

Prefer working implementations over speculative architecture.

Preserve the product's simplicity.

Use real meteorological data.

Create the Puddle mascot.

Apply professional UI/UX judgment.

Use design-generation/reference tools where available and faithfully recreate the resulting visual direction in code.

Keep infrastructure free where reasonably possible.

Automate setup through CLIs, migrations, scripts, and APIs.

Do not ask the user to manually perform work that the development environment can perform.

Do not overengineer.

Test the real application.

Inspect the rendered result.

Fix visual and functional problems.

Deploy the finished application to Vercel.

Verify the deployed application.

Most importantly:

# Build something someone would actually want to check before deciding whether to go outside.