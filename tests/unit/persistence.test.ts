import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { isPersistenceConfigured } from "../../lib/persistence";

describe("Phase 6 persistence setup", () => {
  it("keeps persistence optional when server credentials are absent", () => {
    expect(isPersistenceConfigured()).toBe(false);
  });

  it("defines migration-managed provenance, verification, location, and spatial indexes", () => {
    const migration = readFileSync(resolve("supabase/migrations/20260820041807_create_persistence_schema.sql"), "utf8");
    expect(migration).toContain("create extension if not exists postgis");
    expect(migration).toContain("create table public.forecast_runs");
    expect(migration).toContain("create table public.forecast_predictions");
    expect(migration).toContain("create table public.forecast_source_snapshots");
    expect(migration).toContain("create table public.forecast_verifications");
    expect(migration).toContain("create table public.saved_locations");
    expect(migration).toContain("using gist (location)");
    expect(migration.match(/enable row level security/g)).toHaveLength(5);
  });
});
