grant usage on schema public to service_role;
grant select, insert, update on table public.forecast_runs to service_role;
grant select, insert, update on table public.forecast_predictions to service_role;
grant select, insert, update on table public.forecast_source_snapshots to service_role;
grant select, insert, update on table public.forecast_verifications to service_role;
