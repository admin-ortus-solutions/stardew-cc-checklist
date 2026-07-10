import { describe, expect, it } from "vitest";
import {
  computeBundleProgress,
  fullContribution,
  type CheckedItems,
} from "./progress";
import type { Bundle, BundleItem } from "./schema";

function slot(over: Partial<BundleItem> & { id: string }): BundleItem {
  return {
    name: over.id,
    sprite: `/sprites/${over.id}.png`,
    quantity: 1,
    quality: "any",
    seasons: ["spring"],
    weather: "any",
    time: "any",
    source: "forage",
    location: "test",
    dayGated: false,
    howToGet: "test",
    ...over,
  };
}

function bundle(needed: number, items: BundleItem[]): Bundle {
  return { id: "b", name: "B", color: "green", needed, items };
}

const checkedFull = (...items: BundleItem[]): CheckedItems =>
  Object.fromEntries(items.map((i) => [i.id, fullContribution(i)]));

describe("computeBundleProgress", () => {
  it("N-of-M: counts only satisfied slots against needed", () => {
    const a = slot({ id: "a" });
    const b = slot({ id: "b" });
    const c = slot({ id: "c" });
    const p = computeBundleProgress(bundle(2, [a, b, c]), checkedFull(a));
    expect(p.satisfied).toBe(1);
    expect(p.needed).toBe(2);
    expect(p.isComplete).toBe(false);
    expect(p.satisfiedIds).toEqual(["a"]);
  });

  it("complete boundary: one short, exactly complete, over-complete", () => {
    const items = ["a", "b", "c", "d"].map((id) => slot({ id }));
    const [a, b, c] = items;

    const short = computeBundleProgress(bundle(3, items), checkedFull(a, b));
    expect(short.isComplete).toBe(false);

    const exact = computeBundleProgress(bundle(3, items), checkedFull(a, b, c));
    expect(exact.satisfied).toBe(3);
    expect(exact.isComplete).toBe(true);

    const over = computeBundleProgress(bundle(3, items), checkedFull(...items));
    expect(over.satisfied).toBe(4);
    expect(over.isComplete).toBe(true);
  });

  it("quantity: a slot is satisfied only when contributed quantity meets the requirement", () => {
    const wood = slot({ id: "wood", quantity: 99 });
    const b = bundle(1, [wood]);

    const tooFew = computeBundleProgress(b, { wood: { quantity: 50, quality: "any" } });
    expect(tooFew.satisfied).toBe(0);

    const exact = computeBundleProgress(b, { wood: { quantity: 99, quality: "any" } });
    expect(exact.satisfied).toBe(1);

    const surplus = computeBundleProgress(b, { wood: { quantity: 120, quality: "any" } });
    expect(surplus.satisfied).toBe(1);
  });

  it("quality: contributed quality must meet or exceed the required quality", () => {
    const goldParsnip = slot({ id: "parsnip", quality: "gold" });
    const b = bundle(1, [goldParsnip]);

    const silver = computeBundleProgress(b, { parsnip: { quantity: 1, quality: "silver" } });
    expect(silver.satisfied).toBe(0);

    const gold = computeBundleProgress(b, { parsnip: { quantity: 1, quality: "gold" } });
    expect(gold.satisfied).toBe(1);

    const iridium = computeBundleProgress(b, { parsnip: { quantity: 1, quality: "iridium" } });
    expect(iridium.satisfied).toBe(1);
  });

  it("empty check set yields zero progress", () => {
    const items = ["a", "b"].map((id) => slot({ id }));
    const p = computeBundleProgress(bundle(2, items), {});
    expect(p.satisfied).toBe(0);
    expect(p.isComplete).toBe(false);
    expect(p.satisfiedIds).toEqual([]);
  });

  it("ignores checked ids that are not slots in this bundle", () => {
    const a = slot({ id: "a" });
    const p = computeBundleProgress(bundle(1, [a]), {
      a: fullContribution(a),
      stranger: { quantity: 1, quality: "any" },
    });
    expect(p.satisfied).toBe(1);
    expect(p.isComplete).toBe(true);
  });
});
