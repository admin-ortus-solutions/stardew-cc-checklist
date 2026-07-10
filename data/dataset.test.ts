import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import raw from "./community-center.json";
import { DatasetSchema } from "../lib/schema";

describe("community-center dataset", () => {
  it("validates against the schema", () => {
    const result = DatasetSchema.safeParse(raw);
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.format(), null, 2));
    }
  });

  const dataset = DatasetSchema.parse(raw);
  const bundles = dataset.rooms.flatMap((r) => r.bundles);

  it("has all six rooms in Community Center menu order", () => {
    expect(dataset.rooms.map((r) => r.id)).toEqual([
      "crafts-room",
      "pantry",
      "fish-tank",
      "boiler-room",
      "bulletin-board",
      "vault",
    ]);
  });

  it("has no duplicate slot ids across the whole dataset", () => {
    const ids = bundles.flatMap((b) => b.items.map((i) => i.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every bundle's needed does not exceed its slot count", () => {
    for (const b of bundles) {
      expect(b.needed, `${b.id} needed`).toBeLessThanOrEqual(b.items.length);
    }
  });

  it("every sprite path resolves to a committed file in public/", () => {
    const publicDir = join(__dirname, "..", "public");
    for (const b of bundles) {
      for (const item of b.items) {
        const file = join(publicDir, item.sprite);
        expect(existsSync(file), `missing sprite ${item.sprite}`).toBe(true);
      }
    }
  });

  it("every slot id is namespaced to its bundle", () => {
    for (const b of bundles) {
      for (const item of b.items) {
        expect(item.id.startsWith(`${b.id}-`), `${item.id} in ${b.id}`).toBe(true);
      }
    }
  });

  it("seeds the Crafts Room with its six 1.6 bundles", () => {
    const crafts = dataset.rooms.find((r) => r.id === "crafts-room");
    expect(crafts?.bundles.map((b) => b.id)).toEqual([
      "spring-foraging",
      "summer-foraging",
      "fall-foraging",
      "winter-foraging",
      "construction",
      "exotic-foraging",
    ]);
  });

  it("locks the load-bearing N-of-M bundle shapes", () => {
    const byId = Object.fromEntries(bundles.map((b) => [b.id, b]));

    // Exotic Foraging is a 5-of-9 bundle.
    expect(byId["exotic-foraging"].needed).toBe(5);
    expect(byId["exotic-foraging"].items).toHaveLength(9);

    // Construction has two separate Wood x99 slots plus Stone x99 and Hardwood x10.
    const construction = byId["construction"];
    expect(construction.needed).toBe(4);
    expect(construction.items.map((i) => i.quantity)).toEqual([99, 99, 99, 10]);
    expect(construction.items.filter((i) => i.name === "Wood")).toHaveLength(2);

    // Partial-completion bundles.
    expect(byId["quality-crops"].needed).toBe(3); // 3 of 4
    expect(byId["animal"].needed).toBe(5); // 5 of 6
    expect(byId["artisan"].needed).toBe(6); // 6 of 12
    expect(byId["crab-pot"].needed).toBe(5); // 5 of 10
    expect(byId["adventurers-bundle"].needed).toBe(2); // 2 of 4
  });

  it("models the Vault as four money bundles", () => {
    const vault = dataset.rooms.find((r) => r.id === "vault");
    expect(vault?.bundles).toHaveLength(4);
    for (const b of vault!.bundles) {
      expect(b.needed).toBe(1);
      expect(b.items).toHaveLength(1);
      expect(b.items[0].source).toBe("money");
    }
    expect(vault!.bundles.map((b) => b.items[0].quantity)).toEqual([
      2500, 5000, 10000, 25000,
    ]);
  });
});
