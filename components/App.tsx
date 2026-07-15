"use client";

import { useState } from "react";
import { Checklist } from "./Checklist";
import { GiftsPanel } from "./GiftsPanel";
import { RecipesPanel } from "./RecipesPanel";
import { FishPanel } from "./FishPanel";
import { NameBar } from "./NameBar";
import { useDisplayName } from "@/lib/useDisplayName";
import type { CookingRecipe, CraftingRecipe, Fish, Room, Villager } from "@/lib/schema";

type Tab = "cc" | "recipes" | "fish" | "gifts";

export function App({
  rooms,
  villagers,
  cooking,
  crafting,
  fish,
}: {
  rooms: Room[];
  villagers: Villager[];
  cooking: CookingRecipe[];
  crafting: CraftingRecipe[];
  fish: Fish[];
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
          className={`tab${tab === "fish" ? " tab--active" : ""}`}
          type="button"
          onClick={() => setTab("fish")}
        >
          Fish
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
      {tab === "fish" && <FishPanel fish={fish} name={name} />}
      {tab === "gifts" && <GiftsPanel villagers={villagers} name={name} />}
    </div>
  );
}
