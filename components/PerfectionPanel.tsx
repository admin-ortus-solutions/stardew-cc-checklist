"use client";

import { useMemo } from "react";
import { useChecks } from "@/lib/useChecks";
import { checkedItemsFromBoard, indexSlots } from "@/lib/board";
import { computeOverallProgress } from "@/lib/progress";
import { recipeProgress } from "@/lib/recipes";
import { fishProgress } from "@/lib/fish";
import { isPerfect, overallFraction, type CategoryProgress } from "@/lib/perfection";
import type { CookingRecipe, CraftingRecipe, Fish, Room } from "@/lib/schema";

export function PerfectionPanel({
  rooms,
  cooking,
  crafting,
  fish,
}: {
  rooms: Room[];
  cooking: CookingRecipe[];
  crafting: CraftingRecipe[];
  fish: Fish[];
}) {
  const { attribution } = useChecks("checks-overview");

  const index = useMemo(() => indexSlots(rooms), [rooms]);
  const cookIds = useMemo(() => cooking.map((r) => r.id), [cooking]);
  const craftIds = useMemo(() => crafting.map((r) => r.id), [crafting]);

  const ccChecked = checkedItemsFromBoard(attribution, index);
  const cc = computeOverallProgress(rooms, ccChecked);
  const cook = recipeProgress(cookIds, attribution, "cook");
  const craft = recipeProgress(craftIds, attribution, "craft");
  const fishP = fishProgress(fish, attribution);

  const categories: CategoryProgress[] = [
    { key: "cc", label: "Community Center", unit: "bundles", done: cc.complete, total: cc.total, fraction: cc.fraction },
    { key: "cook", label: "Cooking", unit: "recipes", done: cook.made, total: cook.total, fraction: cook.fraction },
    { key: "craft", label: "Crafting", unit: "recipes", done: craft.made, total: craft.total, fraction: craft.fraction },
    { key: "fish", label: "Fish", unit: "caught", done: fishP.caught, total: fishP.total, fraction: fishP.fraction },
  ];

  const overall = overallFraction(categories);
  const overallPct = Math.round(overall * 100);
  const perfect = isPerfect(categories);

  return (
    <div>
      <p className="panel-note">
        Your group&apos;s march to Perfection across everything tracked here. More categories
        (shipping, walnuts, friendships) are on the way.
      </p>

      <div className="overall">
        <div className="progress progress--big">
          <div className="progress__meta">
            <span className="progress__label">{perfect ? "Perfection! ✦" : "Tracked completion"}</span>
            <span className="progress__count">{overallPct}%</span>
          </div>
          <div className="progress__track">
            <div className="progress__fill" style={{ width: `${overallPct}%` }} />
          </div>
        </div>
      </div>

      <ul className="perf-cats">
        {categories.map((c) => {
          const pct = Math.round(c.fraction * 100);
          const done = c.done >= c.total && c.total > 0;
          return (
            <li key={c.key} className={`perf-cat${done ? " perf-cat--done" : ""}`}>
              <div className="progress">
                <div className="progress__meta">
                  <span className="progress__label">
                    {c.label}
                    {done ? " ✓" : ""}
                  </span>
                  <span className="progress__count">
                    {c.done}/{c.total} {c.unit} · {pct}%
                  </span>
                </div>
                <div className="progress__track">
                  <div className="progress__fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
