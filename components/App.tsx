"use client";

import { useState } from "react";
import { Checklist } from "./Checklist";
import { GiftsPanel } from "./GiftsPanel";
import { RecipesPanel } from "./RecipesPanel";
import { NameBar } from "./NameBar";
import { useDisplayName } from "@/lib/useDisplayName";
import type { CookingRecipe, CraftingRecipe, Room, Villager } from "@/lib/schema";

type Tab = "cc" | "recipes" | "gifts";

export function App({
  rooms,
  villagers,
  cooking,
  crafting,
}: {
  rooms: Room[];
  villagers: Villager[];
  cooking: CookingRecipe[];
  crafting: CraftingRecipe[];
}) {
  const { name, setName, hydrated } = useDisplayName();
  const [tab, setTab] = useState<Tab>("cc");

  return (
    <div>
      <NameBar name={name} setName={setName} ready={hydrated} />
      <nav className="tabs">
        <button
          className={`tab${tab === "cc" ? " tab--active" : ""}`}
          type="button"
          onClick={() => setTab("cc")}
        >
          Community Center
        </button>
        <button
          className={`tab${tab === "recipes" ? " tab--active" : ""}`}
          type="button"
          onClick={() => setTab("recipes")}
        >
          Recipes
        </button>
        <button
          className={`tab${tab === "gifts" ? " tab--active" : ""}`}
          type="button"
          onClick={() => setTab("gifts")}
        >
          Gifts
        </button>
      </nav>
      {tab === "cc" && <Checklist rooms={rooms} name={name} />}
      {tab === "recipes" && <RecipesPanel cooking={cooking} crafting={crafting} name={name} />}
      {tab === "gifts" && <GiftsPanel villagers={villagers} name={name} />}
    </div>
  );
}
