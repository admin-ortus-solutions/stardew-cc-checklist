import { test, expect } from "@playwright/test";
import { stubBackend } from "./stub";
import { setDisplayName } from "./helpers";

test.beforeEach(async ({ page }) => {
  await stubBackend(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Recipes", exact: true }).click();
});

test("Recipes tab renders cooking recipes and a progress bar", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Cooking" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Crafting" })).toBeVisible();

  // Cooking is the default sub-tab; a known recipe and its progress show.
  await expect(page.locator(".recipe").first()).toBeVisible();
  await expect(page.getByText("Fried Egg", { exact: true })).toBeVisible();
  await expect(page.getByText(/\d+\/\d+ made/)).toBeVisible();
});

test("switching to the Crafting sub-tab swaps the list", async ({ page }) => {
  await expect(page.getByText("Fried Egg", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Crafting" }).click();
  await expect(page.getByText("Cherry Bomb", { exact: true })).toBeVisible();
  await expect(page.getByText("Fried Egg", { exact: true })).toHaveCount(0);
});

test("search filters the recipe list", async ({ page }) => {
  const rows = page.locator(".recipe");
  const before = await rows.count();
  expect(before).toBeGreaterThan(10);

  await page.getByPlaceholder("Search recipes…").fill("Omelet");
  await expect(page.getByText("Omelet", { exact: true })).toBeVisible();
  expect(await rows.count()).toBeLessThan(before);
});

test("ticking a recipe updates the UI and only hits the stub", async ({ page }) => {
  await setDisplayName(page, "Tester");

  const row = page.locator(".recipe").first();
  const box = row.locator("input.recipe__check");
  await expect(box).not.toBeChecked();
  await box.check();
  await expect(box).toBeChecked();
  await expect(row).toHaveClass(/recipe--made/);
});
