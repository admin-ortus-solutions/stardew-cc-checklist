import { describe, expect, it } from "vitest";
import {
  emptyFishFilter,
  fishLocations,
  fishProgress,
  fishSlotId,
  isCatchableNow,
  matchesFish,
} from "./fish";
import type { BoardState } from "./board";
import type { Fish } from "./schema";

const pufferfish: Fish = {
  id: "pufferfish",
  name: "Pufferfish",
  sprite: "/fish/pufferfish.png",
  seasons: ["summer"],
  weather: "sunny",
  time: "day",
  locations: ["Ocean"],
  howToCatch: "Ocean, summer, sunny, midday.",
};

const catfish: Fish = {
  id: "catfish",
  name: "Catfish",
  sprite: "/fish/catfish.png",
  seasons: ["spring", "fall"],
  weather: "rain",
  time: "any",
  locations: ["Cindersap Forest River", "Secret Woods"],
  howToCatch: "Rivers when raining.",
};

describe("fishSlotId", () => {
  it("namespaces fish so they share the board without colliding", () => {
    expect(fishSlotId("pufferfish")).toBe("fish-pufferfish");
  });
});

describe("fishProgress", () => {
  it("counts caught fish", () => {
    const attribution: BoardState = { "fish-pufferfish": { checkedBy: "Sam", checkedAt: "t" } };
    expect(fishProgress([pufferfish, catfish], attribution)).toEqual({
      caught: 1,
      total: 2,
      fraction: 0.5,
    });
  });
});

describe("isCatchableNow", () => {
  it("requires season, weather, and time to all match", () => {
    expect(isCatchableNow(pufferfish, "summer", false, false)).toBe(true); // summer/sunny/day
    expect(isCatchableNow(pufferfish, "winter", false, false)).toBe(false); // wrong season
    expect(isCatchableNow(pufferfish, "summer", true, false)).toBe(false); // needs sunny
    expect(isCatchableNow(pufferfish, "summer", false, true)).toBe(false); // needs day
  });

  it("treats any-weather / any-time as always matching those axes", () => {
    expect(isCatchableNow(catfish, "spring", true, true)).toBe(true); // rain + any time
    expect(isCatchableNow(catfish, "spring", false, false)).toBe(false); // needs rain
  });
});

describe("matchesFish", () => {
  it("passes with the empty filter", () => {
    expect(matchesFish(pufferfish, emptyFishFilter, false)).toBe(true);
  });

  it("filters by season, location, search, and hideCaught", () => {
    expect(matchesFish(catfish, { ...emptyFishFilter, season: "spring" }, false)).toBe(true);
    expect(matchesFish(catfish, { ...emptyFishFilter, season: "summer" }, false)).toBe(false);
    expect(matchesFish(catfish, { ...emptyFishFilter, location: "Secret Woods" }, false)).toBe(true);
    expect(matchesFish(pufferfish, { ...emptyFishFilter, search: "puff" }, false)).toBe(true);
    expect(matchesFish(pufferfish, { ...emptyFishFilter, hideCaught: true }, true)).toBe(false);
  });
});

describe("fishLocations", () => {
  it("returns the sorted unique set of locations", () => {
    expect(fishLocations([pufferfish, catfish])).toEqual([
      "Cindersap Forest River",
      "Ocean",
      "Secret Woods",
    ]);
  });
});
