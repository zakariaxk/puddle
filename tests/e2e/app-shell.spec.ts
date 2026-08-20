import { expect, test } from "@playwright/test";

test("serves the application shell", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Puddle/);
  await expect(page.getByRole("heading", { name: "Puddle" })).toBeVisible();
  await expect(page.getByText("Application foundation")).toBeVisible();
});
