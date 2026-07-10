import { describe, expect, it } from "vitest";
import { itemTags } from "./tags";
import type { BundleItem } from "./schema";

const base: BundleItem = {
  id: "spring-foraging-wild-horseradish",
  name: "Wild Horseradish",
  sprite: "/sprites/wild-horseradish.png",
  quantity: 1,
  quality: "any",
  seasons: ["spring"],
  weather: "any",
  time: "any",
  source: "forage",
  location: "Anywhere",
  dayGated: false,
  howToGet: "Foraging in Spring.",
};

describe("itemTags", () => {
  it("emits a capitalized season tag and a source tag for a plain forage item", () => {
    expect(itemTags(base)).toEqual([
      { kind: "season", label: "Spring" },
      { kind: "source", label: "Forage" },
    ]);
  });

  it("adds weather, time, and location tags when they are constrained", () => {
    const catfish: BundleItem = {
      ...base,
      seasons: ["spring", "fall"],
      weather: "rain",
      time: "night",
      source: "fish",
      location: "River",
    };
    expect(itemTags(catfish)).toEqual([
      { kind: "season", label: "Spring" },
      { kind: "season", label: "Fall" },
      { kind: "weather", label: "Rain" },
      { kind: "time", label: "Night" },
      { kind: "source", label: "Fish" },
      { kind: "location", label: "River" },
    ]);
  });

  it("adds a Limited window tag for day-gated items", () => {
    expect(itemTags({ ...base, dayGated: true })).toContainEqual({
      kind: "day-gated",
      label: "Limited window",
    });
  });
});
