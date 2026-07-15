import type { BoardState } from "./board";
import type { Fish, Season } from "./schema";

export const FISH_SLOT_PREFIX = "fish-";

export function fishSlotId(id: string): string {
  return `${FISH_SLOT_PREFIX}${id}`;
}

export type FishProgress = { caught: number; total: number; fraction: number };

export function fishProgress(fish: Fish[], attribution: BoardState): FishProgress {
  const total = fish.length;
  let caught = 0;
  for (const f of fish) if (attribution[fishSlotId(f.id)]) caught++;
  return { caught, total, fraction: total === 0 ? 0 : caught / total };
}

/** Catchable under the given conditions: season, weather, and time-of-day all match. */
export function isCatchableNow(
  fish: Fish,
  season: Season,
  isRaining: boolean,
  isNight: boolean,
): boolean {
  const seasonOk = fish.seasons.includes(season);
  const weatherOk =
    fish.weather === "any" || (isRaining ? fish.weather === "rain" : fish.weather === "sunny");
  const timeOk = fish.time === "any" || (isNight ? fish.time === "night" : fish.time === "day");
  return seasonOk && weatherOk && timeOk;
}

export type FishFilter = {
  search: string;
  season: Season | null;
  location: string | null;
  hideCaught: boolean;
};

export const emptyFishFilter: FishFilter = {
  search: "",
  season: null,
  location: null,
  hideCaught: false,
};

export function matchesFish(fish: Fish, filter: FishFilter, caught: boolean): boolean {
  const q = filter.search.trim().toLowerCase();
  if (q && !fish.name.toLowerCase().includes(q)) return false;
  if (filter.season && !fish.seasons.includes(filter.season)) return false;
  if (filter.location && !fish.locations.includes(filter.location)) return false;
  if (filter.hideCaught && caught) return false;
  return true;
}

export function fishLocations(fish: Fish[]): string[] {
  const set = new Set<string>();
  for (const f of fish) for (const loc of f.locations) set.add(loc);
  return [...set].sort();
}
