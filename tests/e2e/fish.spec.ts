import { test, expect } from "@playwright/test";
import { stubBackend } from "./stub";
import { setDisplayName } from "./helpers";

test.beforeEach(async ({ page }) => {
  await stubBackend(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Fish", exact: true }).click();
});

test("Fish tab renders the catalogue and a progress bar", async ({ page }) => {
  await expect(page.locator(".recipe").first()).toBeVisible();
  await expect(page.getByText("Pufferfish", { exact: true })).toBeVisible();
  await expect(page.getByText(/\d+\/\d+ caught/)).toBeVisible();
});

test("search filters the fish list", async ({ page }) => {
  const rows = page.locator(".recipe");
  const before = await rows.count();
  expect(before).toBeGreaterThan(20);

  await page.getByPlaceholder("Search fish…").fill("Pufferfish");
  await expect(page.getByText("Pufferfish", { exact: true })).toBeVisible();
  expect(await rows.count()).toBeLessThan(before);
});

test("Catchable now reveals condition controls", async ({ page }) => {
  await expect(page.getByLabel("Raining", { exact: true })).toHaveCount(0);
  await page.getByLabel("Catchable now").check();
  await expect(page.getByLabel("Raining", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Night", { exact: true })).toBeVisible();
});

test("ticking a fish updates the UI and only hits the stub", async ({ page }) => {
  await setDisplayName(page, "Anglerette");

  const row = page.locator(".recipe").first();
  const box = row.locator("input.recipe__check");
  await expect(box).not.toBeChecked();
  await box.check();
  await expect(box).toBeChecked();
  await expect(row).toHaveClass(/recipe--made/);
});
