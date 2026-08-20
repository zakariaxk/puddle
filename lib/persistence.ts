import { createClient } from "@supabase/supabase-js";

import type { ConsumerForecast } from "./forecast";

type Database = {
  public: {
    Tables: {
      forecast_runs: {
        Row: { id: string; generated_at: string; latitude: number; longitude: number; confidence: string; status: string; message: string; source_snapshot: unknown };
        Insert: { generated_at: string; latitude: number; longitude: number; confidence: string; status: string; message: string; source_snapshot: unknown };
        Update: never;
        Relationships: [];
      };
      forecast_predictions: {
        Row: { id: string; forecast_run_id: string; target_start: string; target_end: string; horizon_minutes: number; probability_percent: number; intensity: string; arrival_window: string | null; model_version: string };
        Insert: { forecast_run_id: string; target_start: string; target_end: string; horizon_minutes: number; probability_percent: number; intensity: string; arrival_window: string | null; model_version: string };
        Update: never;
        Relationships: [];
      };
      forecast_source_snapshots: {
        Row: { id: string; forecast_run_id: string; source_id: string; provider: string; dataset: string; source_kind: string; availability: string; fetched_at: string; source_timestamp: string | null; message: string | null };
        Insert: { forecast_run_id: string; source_id: string; provider: string; dataset: string; source_kind: string; availability: string; fetched_at: string; source_timestamp: string | null; message: string | null };
        Update: never;
        Relationships: [];
      };
      forecast_verifications: {
        Row: { id: string; forecast_prediction_id: string; actual_precipitation_mm: number; rain_observed: boolean; verified_at: string };
        Insert: { forecast_prediction_id: string; actual_precipitation_mm: number; rain_observed: boolean; verified_at: string };
        Update: { actual_precipitation_mm?: number; rain_observed?: boolean; verified_at?: string };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type PersistenceClient = ReturnType<typeof createClient<Database>>;

type ForecastRunInput = {
  forecast: ConsumerForecast;
};

export type ForecastHistoryItem = {
  runId: string;
  createdAt: string;
  probabilityPercent: number;
  confidence: ConsumerForecast["confidence"];
};

function getPersistenceClient(): PersistenceClient | null {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secretKey) return null;

  return createClient<Database>(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function isPersistenceConfigured() {
  return Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));
}

export async function recordForecast({ forecast }: ForecastRunInput) {
  const client = getPersistenceClient();
  if (!client) return { status: "disabled" as const };

  const { data: run, error: runError } = await client
    .from("forecast_runs")
    .insert({
      generated_at: forecast.generatedAt,
      latitude: forecast.location.latitude,
      longitude: forecast.location.longitude,
      confidence: forecast.confidence,
      status: forecast.status,
      message: forecast.message,
      source_snapshot: forecast.sources,
    })
    .select("id")
    .single();

  if (runError || !run) throw new Error(runError?.message ?? "Could not save the forecast run.");

  const predictions = forecast.horizons.map((horizon) => ({
    forecast_run_id: run.id,
    target_start: forecast.generatedAt,
    target_end: new Date(Date.parse(forecast.generatedAt) + horizon.minutes * 60_000).toISOString(),
    horizon_minutes: horizon.minutes,
    probability_percent: horizon.probabilityPercent,
    intensity: horizon.intensity,
    arrival_window: horizon.arrival,
    model_version: forecast.modelVersion,
  }));
  const { error: predictionsError } = await client.from("forecast_predictions").insert(predictions);
  if (predictionsError) throw new Error(predictionsError.message);

  const sourceSnapshots = forecast.sources.map((source) => ({
    forecast_run_id: run.id,
    source_id: source.id,
    provider: source.provider,
    dataset: source.dataset,
    source_kind: source.kind,
    availability: source.status,
    fetched_at: source.fetchedAt,
    source_timestamp: source.sourceTimestamp ?? null,
    message: source.message ?? null,
  }));
  const { error: sourcesError } = await client.from("forecast_source_snapshots").insert(sourceSnapshots);
  if (sourcesError) throw new Error(sourcesError.message);

  return { status: "saved" as const, runId: run.id };
}

export async function getForecastHistory(latitude: number, longitude: number, limit = 12): Promise<ForecastHistoryItem[] | null> {
  const client = getPersistenceClient();
  if (!client) return null;

  const { data, error } = await client
    .from("forecast_runs")
    .select("id, generated_at, confidence, forecast_predictions!inner(probability_percent, horizon_minutes)")
    .eq("latitude", latitude)
    .eq("longitude", longitude)
    .eq("forecast_predictions.horizon_minutes", 60)
    .order("generated_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);

  type HistoryRun = { id: string; generated_at: string; confidence: string; forecast_predictions: Array<{ probability_percent: number }> };
  return ((data ?? []) as unknown as HistoryRun[]).flatMap((run) => {
    const prediction = run.forecast_predictions[0];
    if (!prediction) return [];
    return [{
      runId: run.id,
      createdAt: run.generated_at,
      probabilityPercent: prediction.probability_percent,
      confidence: run.confidence as ConsumerForecast["confidence"],
    }];
  });
}

export async function recordForecastVerification(input: {
  predictionId: string;
  actualPrecipitationMm: number;
  rainObserved: boolean;
  verifiedAt: string;
}) {
  const client = getPersistenceClient();
  if (!client) return { status: "disabled" as const };

  const { error } = await client.from("forecast_verifications").upsert({
    forecast_prediction_id: input.predictionId,
    actual_precipitation_mm: input.actualPrecipitationMm,
    rain_observed: input.rainObserved,
    verified_at: input.verifiedAt,
  }, { onConflict: "forecast_prediction_id" });
  if (error) throw new Error(error.message);
  return { status: "saved" as const };
}
