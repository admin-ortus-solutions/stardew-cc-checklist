import { describe, expect, it } from "vitest";
import {
  emptyFilter,
  filterItems,
  isAvailableNow,
  matchesSearch,
  matchesSeason,
  matchesSource,
  passesFilter,
  type ItemFilter,
} from "./filters";
import type { BundleItem } from "./schema";

function item(over: Partial<BundleItem> & { id: string }): BundleItem {
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

describe("emptyFilter", () => {
  it("is the neutral filter", () => {
    expect(emptyFilter).toEqual({
      season: null,
      source: null,
      search: "",
      hideCompleted: false,
    });
  });
});

describe("matchesSeason", () => {
  it("null matches all items", () => {
    expect(matchesSeason(item({ id: "a", seasons: ["fall"] }), null)).toBe(true);
  });

  it("single-season item matches its season, not others", () => {
    const i = item({ id: "a", seasons: ["summer"] });
    expect(matchesSeason(i, "summer")).toBe(true);
    expect(matchesSeason(i, "winter")).toBe(false);
  });

  it("multi-season item matches each of its seasons and not others", () => {
    const i = item({ id: "a", seasons: ["spring", "fall"] });
    expect(matchesSeason(i, "spring")).toBe(true);
    expect(matchesSeason(i, "fall")).toBe(true);
    expect(matchesSeason(i, "summer")).toBe(false);
    expect(matchesSeason(i, "winter")).toBe(false);
  });
});

describe("matchesSource", () => {
  it("null matches all items", () => {
    expect(matchesSource(item({ id: "a", source: "fish" }), null)).toBe(true);
  });

  it("matches on exact source", () => {
    expect(matchesSource(item({ id: "a", source: "fish" }), "fish")).toBe(true);
  });

  it("does not match a different source", () => {
    expect(matchesSource(item({ id: "a", source: "fish" }), "crop")).toBe(false);
  });
});

describe("matchesSearch", () => {
  it("empty query matches", () => {
    expect(matchesSearch(item({ id: "a", name: "Parsnip" }), "")).toBe(true);
  });

  it("whitespace-only query matches", () => {
    expect(matchesSearch(item({ id: "a", name: "Parsnip" }), "   ")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(matchesSearch(item({ id: "a", name: "Parsnip" }), "parsnip")).toBe(true);
    expect(matchesSearch(item({ id: "a", name: "parsnip" }), "PARSNIP")).toBe(true);
  });

  it("matches a partial substring", () => {
    expect(matchesSearch(item({ id: "a", name: "Prismatic Shard" }), "smat")).toBe(true);
  });

  it("does not match an absent substring", () => {
    expect(matchesSearch(item({ id: "a", name: "Parsnip" }), "wood")).toBe(false);
  });
});

describe("isAvailableNow", () => {
  it("in-season with weather 'any' is available", () => {
    const i = item({ id: "a", seasons: ["spring"], weather: "any" });
    expect(isAvailableNow(i, "spring", false)).toBe(true);
    expect(isAvailableNow(i, "spring", true)).toBe(true);
  });

  it("out-of-season is never available", () => {
    const i = item({ id: "a", seasons: ["spring"], weather: "any" });
    expect(isAvailableNow(i, "winter", false)).toBe(false);
  });

  it("rain-only item is available only when raining", () => {
    const i = item({ id: "a", seasons: ["spring"], weather: "rain" });
    expect(isAvailableNow(i, "spring", true)).toBe(true);
    expect(isAvailableNow(i, "spring", false)).toBe(false);
  });

  it("sun-only item is available only when not raining", () => {
    const i = item({ id: "a", seasons: ["spring"], weather: "sunny" });
    expect(isAvailableNow(i, "spring", false)).toBe(true);
    expect(isAvailableNow(i, "spring", true)).toBe(false);
  });

  it("multi-season item is available in each listed season", () => {
    const i = item({ id: "a", seasons: ["spring", "fall"], weather: "any" });
    expect(isAvailableNow(i, "spring", false)).toBe(true);
    expect(isAvailableNow(i, "fall", false)).toBe(true);
    expect(isAvailableNow(i, "summer", false)).toBe(false);
  });

  it("always-available item is available in every season and weather", () => {
    const i = item({
      id: "a",
      seasons: ["spring", "summer", "fall", "winter"],
      weather: "any",
    });
    for (const season of ["spring", "summer", "fall", "winter"] as const) {
      expect(isAvailableNow(i, season, false)).toBe(true);
      expect(isAvailableNow(i, season, true)).toBe(true);
    }
  });
});

describe("passesFilter", () => {
  it("passes an item under the empty filter", () => {
    expect(passesFilter(item({ id: "a" }), emptyFilter, false)).toBe(true);
  });

  it("hideCompleted removes completed items but keeps incomplete ones", () => {
    const i = item({ id: "a" });
    const filter: ItemFilter = { ...emptyFilter, hideCompleted: true };
    expect(passesFilter(i, filter, true)).toBe(false);
    expect(passesFilter(i, filter, false)).toBe(true);
  });

  it("keeps completed items when hideCompleted is false", () => {
    expect(passesFilter(item({ id: "a" }), emptyFilter, true)).toBe(true);
  });

  it("ANDs season, source, and search together", () => {
    const i = item({
      id: "a",
      name: "Salmonberry",
      seasons: ["spring"],
      source: "forage",
    });
    const match: ItemFilter = {
      season: "spring",
      source: "forage",
      search: "salmon",
      hideCompleted: false,
    };
    expect(passesFilter(i, match, false)).toBe(true);

    const wrongSearch: ItemFilter = { ...match, search: "wood" };
    expect(passesFilter(i, wrongSearch, false)).toBe(false);
  });

  it("a season that excludes an item overrides a matching source", () => {
    const i = item({ id: "a", seasons: ["spring"], source: "forage" });
    const filter: ItemFilter = {
      season: "winter",
      source: "forage",
      search: "",
      hideCompleted: false,
    };
    expect(passesFilter(i, filter, false)).toBe(false);
  });
});

describe("filterItems", () => {
  const spring = item({ id: "spring-crop", name: "Parsnip", seasons: ["spring"], source: "crop" });
  const summer = item({ id: "summer-fish", name: "Pufferfish", seasons: ["summer"], source: "fish" });
  const both = item({ id: "both-forage", name: "Salmonberry", seasons: ["spring", "fall"], source: "forage" });
  const items = [spring, summer, both];
  const noneComplete = () => false;

  it("returns everything under the empty filter", () => {
    expect(filterItems(items, emptyFilter, noneComplete)).toEqual(items);
  });

  it("narrows by season", () => {
    const filter: ItemFilter = { ...emptyFilter, season: "spring" };
    expect(filterItems(items, filter, noneComplete)).toEqual([spring, both]);
  });

  it("narrows by season and source together", () => {
    const filter: ItemFilter = { ...emptyFilter, season: "spring", source: "crop" };
    expect(filterItems(items, filter, noneComplete)).toEqual([spring]);
  });

  it("hides completed items", () => {
    const filter: ItemFilter = { ...emptyFilter, hideCompleted: true };
    const isCompleted = (i: BundleItem) => i.id === "summer-fish";
    expect(filterItems(items, filter, isCompleted)).toEqual([spring, both]);
  });

  it("combines search with season", () => {
    const filter: ItemFilter = { ...emptyFilter, season: "fall", search: "salmon" };
    expect(filterItems(items, filter, noneComplete)).toEqual([both]);
  });
});
