import { expect, test } from "@playwright/test";

test("serves the product shell and exposes its honest no-data states", async ({ page }) => {
  await page.route("**/api/location/search?q=Melbourne%20Beach", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        results: [{ id: "1", name: "Melbourne Beach, Florida", latitude: 28.0683, longitude: -80.5603 }],
      }),
    });
  });
  await page.goto("/");

  await expect(page).toHaveTitle(/Puddle/);
  await expect(page.getByRole("link", { name: "Puddle home" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Is rain actually coming your way?" })).toBeVisible();
  await expect(page.getByText("Waiting on your location")).toBeVisible();
  await expect(page.getByLabel("Search for a Central Florida place")).toBeVisible();

  await page.getByRole("button", { name: "Why Puddle?" }).click();
  await expect(page.getByText("Until live sources are connected, it will not guess.")).toBeVisible();

  await page.getByLabel("Search for a Central Florida place").fill("Melbourne Beach");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByRole("button", { name: /Melbourne Beach/ })).toBeVisible();
  await page.getByRole("button", { name: /Melbourne Beach/ }).click();
  await expect(page.getByText("Melbourne Beach, Florida is selected.")).toBeVisible();
  await expect(page.getByText("Selected location")).toBeVisible();

  const map = page.getByRole("application", { name: /Central Florida map/ });
  await expect(map).toBeVisible();
  await map.click({ position: { x: 170, y: 180 } });
  await expect(page.locator(".search-status")).toContainText(/Selected point \(/);
});
