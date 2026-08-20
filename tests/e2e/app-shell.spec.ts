import { expect, test } from "@playwright/test";

const radarSnapshot = {
  provider: "RainViewer",
  dataset: "Weather radar observations",
  fetchedAt: "2026-08-19T15:30:00.000Z",
  latestObservedAt: "2026-08-19T15:30:00.000Z",
  frames: [
    { observedAt: "2026-08-19T15:20:00.000Z", tileUrl: "https://tiles.example.test/one/{z}/{x}/{y}.png" },
    { observedAt: "2026-08-19T15:30:00.000Z", tileUrl: "https://tiles.example.test/two/{z}/{x}/{y}.png" },
  ],
  cache: { status: "miss" as const, expiresAt: "2026-08-19T15:32:00.000Z" },
};

const forecastSnapshot = {
  location: { latitude: 28.0683, longitude: -80.5603 }, generatedAt: "2026-08-19T15:30:00.000Z", status: "available", message: "NWS guidance and nearby observations are available.", confidence: "high", fetchedAt: "2026-08-19T15:30:00.000Z",
  horizons: [{ minutes: 15, probabilityPercent: 40, intensity: "light", arrival: "11:30 AM–11:45 AM" }, { minutes: 30, probabilityPercent: 45, intensity: "light", arrival: "11:30 AM–12:00 PM" }, { minutes: 60, probabilityPercent: 52, intensity: "light", arrival: "11:30 AM–12:30 PM" }, { minutes: 120, probabilityPercent: 44, intensity: "light", arrival: "11:30 AM–12:30 PM" }, { minutes: 360, probabilityPercent: 30, intensity: "light", arrival: "11:30 AM–12:30 PM" }],
  why: ["NWS forecast guidance indicates a 52% chance of measurable rain in the next hour at this map point.", "This is a transparent reading of NWS guidance, not a trained Puddle model or radar nowcast."],
  sources: [{ id: "nws-ndfd", provider: "National Weather Service", dataset: "National Digital Forecast Database", kind: "model", status: "available", fetchedAt: "2026-08-19T15:30:00.000Z", sourceTimestamp: "2026-08-19T15:30:00.000Z" }],
};

test("serves the product shell and exposes its honest no-data states", async ({ page }) => {
  await page.route("**/api/radar", async (route) => {
    await route.fulfill({ contentType: "application/json", body: JSON.stringify(radarSnapshot) });
  });
  await page.route("**/api/location/search?q=Melbourne%20Beach", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        results: [{ id: "1", name: "Melbourne Beach, Florida", latitude: 28.0683, longitude: -80.5603 }],
      }),
    });
  });
  await page.route("**/api/forecast?*", async (route) => await route.fulfill({ contentType: "application/json", body: JSON.stringify(forecastSnapshot) }));
  await page.goto("/");

  await expect(page).toHaveTitle(/Puddle/);
  await expect(page.getByRole("link", { name: "Puddle home" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Is rain actually coming your way?" })).toBeVisible();
  await expect(page.getByText("Waiting on your location")).toBeVisible();
  await expect(page.getByLabel("Search for a Central Florida place")).toBeVisible();

  await page.getByLabel("Search for a Central Florida place").fill("Melbourne Beach");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByRole("button", { name: /Melbourne Beach/ })).toBeVisible();
  await page.getByRole("button", { name: /Melbourne Beach/ }).click();
  await expect(page.getByText("Melbourne Beach, Florida is selected.")).toBeVisible();
  await expect(page.getByText("Selected location")).toBeVisible();
  await expect(page.locator(".hero-probability")).toHaveText("52%");
  await expect(page.getByText("Most likely window: 11:30 AM–12:30 PM")).toBeVisible();
  await page.getByRole("button", { name: "Why Puddle?" }).click();
  await expect(page.getByText(/not a trained Puddle model/i)).toBeVisible();

  const map = page.getByRole("application", { name: /Central Florida map/ });
  await expect(map).toBeVisible();
  await expect(page.getByText("Radar observed")).toBeVisible();
  await expect(page.getByRole("link", { name: "Weather data by RainViewer" })).toBeVisible();
  await page.getByRole("button", { name: "Play recent radar" }).click();
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  await map.click({ position: { x: 170, y: 180 } });
  await expect(page.locator(".search-status")).toContainText(/Selected point \(/);
});

test("keeps radar still for reduced motion and recovers from a failed source", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  let attempts = 0;
  await page.route("**/api/radar", async (route) => {
    attempts += 1;
    if (attempts === 1) await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Live radar is temporarily unavailable. Try again shortly." }) });
    else await route.fulfill({ contentType: "application/json", body: JSON.stringify(radarSnapshot) });
  });

  await page.goto("/");
  await expect(page.getByText("Radar is being stubborn.")).toBeVisible();
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("button", { name: "Play recent radar" })).toBeVisible();
  await page.getByRole("button", { name: "Play recent radar" }).click();
  await expect(page.getByRole("button", { name: "Play recent radar" })).toBeVisible();
});
