import type { BundleItem, Season, Source } from "./schema";

export type ItemFilter = {
  season: Season | null;
  source: Source | null;
  search: string;
  hideCompleted: boolean;
};

export const emptyFilter: ItemFilter = {
  season: null,
  source: null,
  search: "",
  hideCompleted: false,
};

export function matchesSeason(item: BundleItem, season: Season | null): boolean {
  return season === null || item.seasons.includes(season);
}

export function matchesSource(item: BundleItem, source: Source | null): boolean {
  return source === null || item.source === source;
}

export function matchesSearch(item: BundleItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  return q === "" || item.name.toLowerCase().includes(q);
}

export function isAvailableNow(
  item: BundleItem,
  season: Season,
  isRaining: boolean,
): boolean {
  const seasonOk = item.seasons.includes(season);
  const weatherOk =
    item.weather === "any" ||
    (isRaining ? item.weather === "rain" : item.weather === "sunny");
  return seasonOk && weatherOk;
}

export function passesFilter(
  item: BundleItem,
  filter: ItemFilter,
  isCompleted: boolean,
): boolean {
  return (
    matchesSeason(item, filter.season) &&
    matchesSource(item, filter.source) &&
    matchesSearch(item, filter.search) &&
    (filter.hideCompleted ? !isCompleted : true)
  );
}

export function filterItems(
  items: BundleItem[],
  filter: ItemFilter,
  isCompleted: (item: BundleItem) => boolean,
): BundleItem[] {
  return items.filter((i) => passesFilter(i, filter, isCompleted(i)));
}
