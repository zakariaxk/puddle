create extension if not exists postgis with schema extensions;

create table public.forecast_runs (
  id uuid primary key default gen_random_uuid(),
  generated_at timestamptz not null,
  latitude double precision not null check (latitude between 27.45 and 29.2),
  longitude double precision not null check (longitude between -82.05 and -80.35),
  location extensions.geography(point, 4326) generated always as (
    extensions.st_setsrid(extensions.st_makepoint(longitude, latitude), 4326)::extensions.geography
  ) stored,
  confidence text not null check (confidence in ('high', 'moderate', 'low')),
  status text not null check (status in ('available', 'degraded', 'unavailable')),
  message text not null,
  source_snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create table public.forecast_predictions (
  id uuid primary key default gen_random_uuid(),
  forecast_run_id uuid not null references public.forecast_runs(id) on delete cascade,
  target_start timestamptz not null,
  target_end timestamptz not null check (target_end > target_start),
  horizon_minutes smallint not null check (horizon_minutes in (15, 30, 60, 120, 360)),
  probability_percent smallint not null check (probability_percent between 0 and 100),
  intensity text not null check (intensity in ('none', 'light', 'moderate', 'heavy')),
  arrival_window text,
  model_version text not null,
  created_at timestamptz not null default now(),
  unique (forecast_run_id, horizon_minutes)
);

create table public.forecast_source_snapshots (
  id uuid primary key default gen_random_uuid(),
  forecast_run_id uuid not null references public.forecast_runs(id) on delete cascade,
  source_id text not null,
  provider text not null,
  dataset text not null,
  source_kind text not null check (source_kind in ('observation', 'model')),
  availability text not null check (availability in ('available', 'unavailable')),
  fetched_at timestamptz not null,
  source_timestamp timestamptz,
  message text,
  unique (forecast_run_id, source_id)
);

create table public.forecast_verifications (
  id uuid primary key default gen_random_uuid(),
  forecast_prediction_id uuid not null unique references public.forecast_predictions(id) on delete cascade,
  actual_precipitation_mm numeric(8, 3) not null check (actual_precipitation_mm >= 0),
  rain_observed boolean not null,
  verified_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.saved_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  latitude double precision not null check (latitude between 27.45 and 29.2),
  longitude double precision not null check (longitude between -82.05 and -80.35),
  location extensions.geography(point, 4326) generated always as (
    extensions.st_setsrid(extensions.st_makepoint(longitude, latitude), 4326)::extensions.geography
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create index forecast_runs_generated_at_idx on public.forecast_runs (generated_at desc);
create index forecast_runs_location_idx on public.forecast_runs using gist (location);
create index forecast_predictions_target_end_idx on public.forecast_predictions (target_end);
create index forecast_predictions_run_horizon_idx on public.forecast_predictions (forecast_run_id, horizon_minutes);
create index forecast_source_snapshots_source_time_idx on public.forecast_source_snapshots (source_id, source_timestamp desc);
create index forecast_verifications_verified_at_idx on public.forecast_verifications (verified_at);
create index saved_locations_user_id_idx on public.saved_locations (user_id, created_at desc);

alter table public.forecast_runs enable row level security;
alter table public.forecast_predictions enable row level security;
alter table public.forecast_source_snapshots enable row level security;
alter table public.forecast_verifications enable row level security;
alter table public.saved_locations enable row level security;

comment on table public.forecast_runs is 'Normalized forecast provenance. Retain for 18 months, then delete in a scheduled server-side job.';
comment on table public.forecast_predictions is 'One measurable-rain prediction per configured horizon.';
comment on table public.forecast_source_snapshots is 'Normalized provider freshness and availability retained with every forecast run.';
comment on table public.forecast_verifications is 'Observed outcomes attached after a prediction target window ends.';
comment on table public.saved_locations is 'Auth-backed saved places. Anonymous saved places remain local to the browser.';
