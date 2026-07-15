import { describe, expect, it } from "vitest";
import {
  emptyRecipeFilter,
  matchesRecipe,
  recipeProgress,
  recipeSlotId,
} from "./recipes";
import type { BoardState } from "./board";

describe("recipeSlotId", () => {
  it("namespaces by kind so cook/craft can share the board with the CC", () => {
    expect(recipeSlotId("cook", "fried-egg")).toBe("cook-fried-egg");
    expect(recipeSlotId("craft", "chest")).toBe("craft-chest");
  });
});

describe("recipeProgress", () => {
  const attribution: BoardState = {
    "cook-fried-egg": { checkedBy: "Sam", checkedAt: "t" },
    "cook-omelet": { checkedBy: "Abby", checkedAt: "t" },
    "craft-chest": { checkedBy: "Sam", checkedAt: "t" }, // wrong kind, ignored
  };

  it("counts only slots of the given kind", () => {
    expect(recipeProgress(["fried-egg", "omelet", "bread"], attribution, "cook")).toEqual({
      made: 2,
      total: 3,
      fraction: 2 / 3,
    });
  });

  it("is zero-safe for an empty list", () => {
    expect(recipeProgress([], attribution, "cook")).toEqual({ made: 0, total: 0, fraction: 0 });
  });
});

describe("matchesRecipe", () => {
  const recipe = { name: "Fried Egg", howToLearn: { source: "start" as const } };

  it("passes with the empty filter", () => {
    expect(matchesRecipe(recipe, emptyRecipeFilter, false)).toBe(true);
  });

  it("filters by case-insensitive name search", () => {
    expect(matchesRecipe(recipe, { ...emptyRecipeFilter, search: "egg" }, false)).toBe(true);
    expect(matchesRecipe(recipe, { ...emptyRecipeFilter, search: "pizza" }, false)).toBe(false);
  });

  it("filters by learn source", () => {
    expect(matchesRecipe(recipe, { ...emptyRecipeFilter, source: "start" }, false)).toBe(true);
    expect(matchesRecipe(recipe, { ...emptyRecipeFilter, source: "shop" }, false)).toBe(false);
  });

  it("hides made recipes when hideMade is set", () => {
    expect(matchesRecipe(recipe, { ...emptyRecipeFilter, hideMade: true }, true)).toBe(false);
    expect(matchesRecipe(recipe, { ...emptyRecipeFilter, hideMade: true }, false)).toBe(true);
  });
});
