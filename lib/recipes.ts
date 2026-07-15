import type { BoardState } from "./board";
import type { RecipeSource } from "./schema";

export type RecipeKind = "cook" | "craft";

/** Board slot id for a recipe — namespaced so it can't collide with a
 *  Community Center slot in the shared `checks` table. */
export function recipeSlotId(kind: RecipeKind, id: string): string {
  return `${kind}-${id}`;
}

export type RecipeProgress = { made: number; total: number; fraction: number };

export function recipeProgress(
  ids: string[],
  attribution: BoardState,
  kind: RecipeKind,
): RecipeProgress {
  const total = ids.length;
  let made = 0;
  for (const id of ids) if (attribution[recipeSlotId(kind, id)]) made++;
  return { made, total, fraction: total === 0 ? 0 : made / total };
}

export const SOURCE_LABELS: Record<RecipeSource, string> = {
  start: "From the start",
  skill: "Skill level",
  shop: "Shop",
  friendship: "Friendship",
  queen_of_sauce: "Queen of Sauce",
  special: "Special",
};

export type RecipeFilter = { search: string; source: RecipeSource | "all"; hideMade: boolean };
export const emptyRecipeFilter: RecipeFilter = { search: "", source: "all", hideMade: false };

export function matchesRecipe(
  recipe: { name: string; howToLearn: { source: RecipeSource } },
  filter: RecipeFilter,
  made: boolean,
): boolean {
  const q = filter.search.trim().toLowerCase();
  if (q && !recipe.name.toLowerCase().includes(q)) return false;
  if (filter.source !== "all" && recipe.howToLearn.source !== filter.source) return false;
  if (filter.hideMade && made) return false;
  return true;
}
