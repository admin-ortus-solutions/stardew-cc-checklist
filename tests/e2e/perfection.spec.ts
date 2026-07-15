import { test, expect } from "@playwright/test";
import { stubBackend } from "./stub";

test.beforeEach(async ({ page }) => {
  await stubBackend(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Perfection", exact: true }).click();
});

test("Perfection tab shows an overall meter and every category", async ({ page }) => {
  await expect(page.getByText("Tracked completion")).toBeVisible();

  for (const label of ["Community Center", "Cooking", "Crafting", "Fish"]) {
    await expect(page.locator(".perf-cat").getByText(label, { exact: true })).toBeVisible();
  }

  // Empty (stubbed) board -> 0%. Category counts render as "X/Y unit · N%".
  await expect(page.getByText(/\d+\/\d+ recipes/).first()).toBeVisible();
  await expect(page.getByText(/\d+\/\d+ caught/)).toBeVisible();
});
