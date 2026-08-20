import { expect, test } from "@playwright/test";

test("serves the product shell and exposes its honest no-data states", async ({ page }) => {
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
  await expect(page.getByText("Location search will be ready with the live map.")).toBeVisible();
});
