import { describe, expect, it } from "vitest";
import {
  computeOverallProgress,
  computeRoomProgress,
  fullContribution,
  type CheckedItems,
} from "./progress";
import type { Bundle, BundleItem, Room } from "./schema";

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

let bundleSeq = 0;
function bundle(needed: number, items: BundleItem[]): Bundle {
  return { id: `b${bundleSeq++}`, name: "B", color: "green", needed, items };
}

function room(id: string, bundles: Bundle[]): Room {
  return { id, name: id, bundles };
}

const checkedFull = (...items: BundleItem[]): CheckedItems =>
  Object.fromEntries(items.map((i) => [i.id, fullContribution(i)]));

describe("computeRoomProgress", () => {
  it("0 of N complete", () => {
    const b1 = bundle(1, [slot({ id: "a" })]);
    const b2 = bundle(1, [slot({ id: "b" })]);
    const p = computeRoomProgress(room("r", [b1, b2]), {});
    expect(p.complete).toBe(0);
    expect(p.total).toBe(2);
    expect(p.fraction).toBe(0);
  });

  it("some complete: 1 of 2 -> fraction 0.5", () => {
    const a = slot({ id: "a" });
    const b = slot({ id: "b" });
    const b1 = bundle(1, [a]);
    const b2 = bundle(1, [b]);
    const p = computeRoomProgress(room("r", [b1, b2]), checkedFull(a));
    expect(p.complete).toBe(1);
    expect(p.total).toBe(2);
    expect(p.fraction).toBe(0.5);
  });

  it("all complete -> fraction 1", () => {
    const a = slot({ id: "a" });
    const b = slot({ id: "b" });
    const p = computeRoomProgress(
      room("r", [bundle(1, [a]), bundle(1, [b])]),
      checkedFull(a, b),
    );
    expect(p.complete).toBe(2);
    expect(p.total).toBe(2);
    expect(p.fraction).toBe(1);
  });

  it("empty room -> total 0, fraction 0 (no divide-by-zero)", () => {
    const p = computeRoomProgress(room("r", []), {});
    expect(p.complete).toBe(0);
    expect(p.total).toBe(0);
    expect(p.fraction).toBe(0);
  });

  it("completion is derived from computeBundleProgress: N-of-M and quantity", () => {
    const a = slot({ id: "a" });
    const b = slot({ id: "b" });
    const c = slot({ id: "c" });
    // needs 2 of 3, only a & b contributed -> complete
    const nOfM = bundle(2, [a, b, c]);
    // quantity requirement not met -> incomplete
    const wood = slot({ id: "wood", quantity: 99 });
    const qty = bundle(1, [wood]);

    const checked: CheckedItems = {
      ...checkedFull(a, b),
      wood: { quantity: 50, quality: "any" },
    };
    const p = computeRoomProgress(room("r", [nOfM, qty]), checked);
    expect(p.complete).toBe(1);
    expect(p.total).toBe(2);
    expect(p.fraction).toBe(0.5);
  });
});

describe("computeOverallProgress", () => {
  it("sums across rooms: 2/3 and 1/2 -> complete 3, total 5, fraction 0.6", () => {
    const mk = () => slot({ id: `s${bundleSeq}-${Math.random()}` });
    const r1Slots = [mk(), mk(), mk()];
    const r1 = room("r1", [
      bundle(1, [r1Slots[0]]),
      bundle(1, [r1Slots[1]]),
      bundle(1, [r1Slots[2]]),
    ]);
    const r2Slots = [mk(), mk()];
    const r2 = room("r2", [bundle(1, [r2Slots[0]]), bundle(1, [r2Slots[1]])]);

    // Complete 2 of r1's bundles and 1 of r2's.
    const checked = checkedFull(r1Slots[0], r1Slots[1], r2Slots[0]);
    const p = computeOverallProgress([r1, r2], checked);
    expect(p.complete).toBe(3);
    expect(p.total).toBe(5);
    expect(p.fraction).toBe(0.6);
  });

  it("no rooms -> total 0, fraction 0", () => {
    const p = computeOverallProgress([], {});
    expect(p.complete).toBe(0);
    expect(p.total).toBe(0);
    expect(p.fraction).toBe(0);
  });

  it("rooms with no bundles contribute nothing", () => {
    const a = slot({ id: "solo" });
    const r1 = room("r1", [bundle(1, [a])]);
    const r2 = room("r2", []);
    const p = computeOverallProgress([r1, r2], checkedFull(a));
    expect(p.complete).toBe(1);
    expect(p.total).toBe(1);
    expect(p.fraction).toBe(1);
  });
});
