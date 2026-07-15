import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import cookingRaw from "./cooking.json";
import craftingRaw from "./crafting.json";
import { CookingDatasetSchema, CraftingDatasetSchema } from "../lib/schema";

const PUBLIC = join(__dirname, "..", "public");

describe("cooking dataset", () => {
  const recipes = CookingDatasetSchema.parse(cookingRaw).recipes;

  it("has the full 1.6 set with unique ids", () => {
    expect(recipes.length).toBe(81);
    const ids = recipes.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every recipe at least one ingredient", () => {
    for (const r of recipes) expect(r.ingredients.length).toBeGreaterThan(0);
  });

  it("has a committed sprite for every recipe", () => {
    for (const r of recipes) {
      expect(existsSync(join(PUBLIC, r.sprite)), `missing ${r.sprite}`).toBe(true);
    }
  });
});

describe("crafting dataset", () => {
  const recipes = CraftingDatasetSchema.parse(craftingRaw).recipes;

  it("has the full Craft Master set with unique ids", () => {
    expect(recipes.length).toBe(149);
    const ids = recipes.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has a committed sprite for every recipe", () => {
    for (const r of recipes) {
      expect(existsSync(join(PUBLIC, r.sprite)), `missing ${r.sprite}`).toBe(true);
    }
  });
});
