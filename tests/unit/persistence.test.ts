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

  it("limits database API access to the server-only service role", () => {
    const grants = readFileSync(resolve("supabase/migrations/20260820044536_grant_persistence_service_access.sql"), "utf8");
    expect(grants).toContain("to service_role");
    expect(grants).not.toMatch(/to (anon|authenticated)/);
  });

  it("permits server-side retention cleanup without public delete access", () => {
    const grants = readFileSync(resolve("supabase/migrations/20260820044705_grant_persistence_retention_access.sql"), "utf8");
    expect(grants).toContain("grant delete");
    expect(grants).toContain("to service_role");
  });

  it("removes public execution of the RLS event trigger", () => {
    const revoke = readFileSync(resolve("supabase/migrations/20260820044839_revoke_rls_trigger_execute.sql"), "utf8");
    expect(revoke).toContain("revoke execute on function public.rls_auto_enable()");
  });
});
