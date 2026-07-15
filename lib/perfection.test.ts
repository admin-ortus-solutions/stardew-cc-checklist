import { describe, expect, it } from "vitest";
import { isPerfect, overallFraction, type CategoryProgress } from "./perfection";

const cat = (fraction: number, done = 0, total = 1): CategoryProgress => ({
  key: "k",
  label: "L",
  unit: "x",
  done,
  total,
  fraction,
});

describe("overallFraction", () => {
  it("averages the category fractions equally", () => {
    expect(overallFraction([cat(1), cat(0)])).toBe(0.5);
    expect(overallFraction([cat(0.5), cat(0.5), cat(0.5)])).toBeCloseTo(0.5);
  });

  it("is zero for no categories", () => {
    expect(overallFraction([])).toBe(0);
  });
});

describe("isPerfect", () => {
  it("is true only when every category is fully done", () => {
    expect(isPerfect([cat(1, 5, 5), cat(1, 3, 3)])).toBe(true);
    expect(isPerfect([cat(1, 5, 5), cat(0.5, 1, 2)])).toBe(false);
    expect(isPerfect([])).toBe(false);
  });
});
