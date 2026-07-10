import type { BundleItem } from "./schema";

export type TagKind = "season" | "weather" | "time" | "source" | "location" | "day-gated";

export type ItemTag = { kind: TagKind; label: string };

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function itemTags(item: BundleItem): ItemTag[] {
  const tags: ItemTag[] = [];
  for (const season of item.seasons) tags.push({ kind: "season", label: cap(season) });
  if (item.weather !== "any") tags.push({ kind: "weather", label: cap(item.weather) });
  if (item.time !== "any") tags.push({ kind: "time", label: cap(item.time) });
  tags.push({ kind: "source", label: cap(item.source) });
  if (item.location !== "Anywhere") tags.push({ kind: "location", label: item.location });
  if (item.dayGated) tags.push({ kind: "day-gated", label: "Limited window" });
  return tags;
}
