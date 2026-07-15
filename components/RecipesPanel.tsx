"use client";

import { useMemo, useState } from "react";
import { useChecks } from "@/lib/useChecks";
import {
  SOURCE_LABELS,
  emptyRecipeFilter,
  matchesRecipe,
  recipeProgress,
  recipeSlotId,
  type RecipeFilter,
  type RecipeKind,
} from "@/lib/recipes";
import { RECIPE_SOURCES, type CookingRecipe, type CraftingRecipe, type RecipeSource } from "@/lib/schema";

const hideImg = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.style.display = "none";
};

type AnyRecipe = (CookingRecipe | CraftingRecipe) & { ingredients?: string[]; category?: string };

export function RecipesPanel({
  cooking,
  crafting,
  name,
}: {
  cooking: CookingRecipe[];
  crafting: CraftingRecipe[];
  name: string;
}) {
  const { attribution, toggle, ready } = useChecks("checks-recipes");
  const [kind, setKind] = useState<RecipeKind>("cook");
  const [filter, setFilter] = useState<RecipeFilter>(emptyRecipeFilter);

  const recipes: AnyRecipe[] = kind === "cook" ? cooking : crafting;
  const interactive = ready && name.trim() !== "";

  const ids = useMemo(() => recipes.map((r) => r.id), [recipes]);
  const progress = recipeProgress(ids, attribution, kind);

  const usedSources = useMemo(() => {
    const set = new Set<RecipeSource>();
    for (const r of recipes) set.add(r.howToLearn.source);
    return RECIPE_SOURCES.filter((s) => set.has(s));
  }, [recipes]);

  const isMade = (id: string) => Boolean(attribution[recipeSlotId(kind, id)]);
  const shown = recipes.filter((r) => matchesRecipe(r, filter, isMade(r.id)));

  function switchKind(next: RecipeKind) {
    setKind(next);
    setFilter(emptyRecipeFilter);
  }

  return (
    <div>
      <p className="panel-note">
        Made every recipe once? That&apos;s two Perfection categories. Everyone ticks off what
        they&apos;ve cooked or crafted — synced live across your group.
      </p>

      <nav className="subtabs">
        <button
          type="button"
          className={`subtab${kind === "cook" ? " subtab--active" : ""}`}
          onClick={() => switchKind("cook")}
        >
          Cooking
        </button>
        <button
          type="button"
          className={`subtab${kind === "craft" ? " subtab--active" : ""}`}
          onClick={() => switchKind("craft")}
        >
          Crafting
        </button>
      </nav>

      <div className="overall">
        <div className="progress progress--big">
          <div className="progress__meta">
            <span className="progress__label">{kind === "cook" ? "Cooking" : "Crafting"}</span>
            <span className="progress__count">
              {progress.made}/{progress.total} made · {Math.round(progress.fraction * 100)}%
            </span>
          </div>
          <div className="progress__track">
            <div className="progress__fill" style={{ width: `${Math.round(progress.fraction * 100)}%` }} />
          </div>
        </div>
      </div>

      <div className="controls">
        <input
          className="control control--search"
          type="search"
          placeholder="Search recipes…"
          value={filter.search}
          onChange={(e) => setFilter({ ...filter, search: e.target.value })}
        />
        <select
          className="control"
          value={filter.source}
          onChange={(e) => setFilter({ ...filter, source: e.target.value as RecipeFilter["source"] })}
        >
          <option value="all">All sources</option>
          {usedSources.map((s) => (
            <option key={s} value={s}>
              {SOURCE_LABELS[s]}
            </option>
          ))}
        </select>
        <label className="control control--check">
          <input
            type="checkbox"
            checked={filter.hideMade}
            onChange={(e) => setFilter({ ...filter, hideMade: e.target.checked })}
          />
          Hide made
        </label>
      </div>

      <ul className="recipes">
        {shown.map((r) => {
          const slot = recipeSlotId(kind, r.id);
          const made = Boolean(attribution[slot]);
          const by = made ? attribution[slot]?.checkedBy : "";
          const secondary =
            kind === "cook" && r.ingredients?.length
              ? r.ingredients.join(", ")
              : r.category ?? "";
          return (
            <li key={r.id} className={`recipe${made ? " recipe--made" : ""}`}>
              <input
                type="checkbox"
                className="recipe__check"
                id={slot}
                checked={made}
                disabled={!interactive}
                onChange={() => toggle(slot, name)}
              />
              <img
                className="recipe__sprite"
                src={r.sprite}
                alt=""
                width={32}
                height={32}
                onError={hideImg}
              />
              <div className="recipe__body">
                <label className="recipe__name" htmlFor={slot}>
                  {r.name}
                </label>
                {secondary && <span className="recipe__secondary">{secondary}</span>}
              </div>
              <span
                className={`recipe__learn recipe__learn--${r.howToLearn.source}`}
                title={r.howToLearn.detail}
              >
                {SOURCE_LABELS[r.howToLearn.source]}
              </span>
              {made && by && <span className="recipe__by">{by}</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
