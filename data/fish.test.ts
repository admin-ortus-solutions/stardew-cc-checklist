import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import raw from "./fish.json";
import { FishDatasetSchema } from "../lib/schema";

const PUBLIC = join(__dirname, "..", "public");

describe("fish dataset", () => {
  const fish = FishDatasetSchema.parse(raw).fish;

  it("covers the full collection (72 Master Angler + 5 Legendary II) with unique ids", () => {
    expect(fish.length).toBe(77);
    const ids = fish.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every fish at least one season and location", () => {
    for (const f of fish) {
      expect(f.seasons.length, `${f.id} seasons`).toBeGreaterThan(0);
      expect(f.locations.length, `${f.id} locations`).toBeGreaterThan(0);
    }
  });

  it("has a committed sprite for every fish", () => {
    for (const f of fish) {
      expect(existsSync(join(PUBLIC, f.sprite)), `missing ${f.sprite}`).toBe(true);
    }
  });
});
