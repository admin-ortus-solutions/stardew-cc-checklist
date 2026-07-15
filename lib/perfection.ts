export type CategoryProgress = {
  key: string;
  label: string;
  done: number;
  total: number;
  unit: string;
  fraction: number;
};

/** Headline completion across tracked categories — the mean of each category's
 *  fraction (equal weight). Honest "how far across everything tracked here",
 *  not the game's official weighted Perfection %, which needs categories we
 *  don't track yet (shipping, walnuts, friendship, …). */
export function overallFraction(categories: CategoryProgress[]): number {
  if (categories.length === 0) return 0;
  return categories.reduce((sum, c) => sum + c.fraction, 0) / categories.length;
}

export function isPerfect(categories: CategoryProgress[]): boolean {
  return categories.length > 0 && categories.every((c) => c.total > 0 && c.done >= c.total);
}
