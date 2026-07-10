import { QUALITIES, type Bundle, type BundleItem, type Quality, type Room } from "./schema";

/**
 * A recorded donation toward a bundle slot. Quantity/quality are carried so the
 * pure progress computation — not the UI — decides whether a slot is satisfied.
 */
export type Contribution = { quantity: number; quality: Quality };

/** Ticked slots keyed by `BundleItem.id`. */
export type CheckedItems = Record<string, Contribution>;

export type BundleProgress = {
  satisfied: number;
  needed: number;
  isComplete: boolean;
  satisfiedIds: string[];
};

const qualityRank = (q: Quality): number => QUALITIES.indexOf(q);

function isSlotSatisfied(slot: BundleItem, c: Contribution | undefined): boolean {
  if (!c) return false;
  if (c.quantity < slot.quantity) return false;
  return qualityRank(c.quality) >= qualityRank(slot.quality);
}

export function computeBundleProgress(
  bundle: Bundle,
  checked: CheckedItems,
): BundleProgress {
  const satisfiedIds = bundle.items
    .filter((slot) => isSlotSatisfied(slot, checked[slot.id]))
    .map((slot) => slot.id);

  return {
    satisfied: satisfiedIds.length,
    needed: bundle.needed,
    isComplete: satisfiedIds.length >= bundle.needed,
    satisfiedIds,
  };
}

/** The contribution a full tick records for a slot: exactly its requirement. */
export function fullContribution(slot: BundleItem): Contribution {
  return { quantity: slot.quantity, quality: slot.quality };
}

export type AggregateProgress = {
  complete: number;
  total: number;
  fraction: number;
};

export function computeRoomProgress(
  room: Room,
  checked: CheckedItems,
): AggregateProgress {
  const complete = room.bundles.filter(
    (bundle) => computeBundleProgress(bundle, checked).isComplete,
  ).length;
  const total = room.bundles.length;
  return { complete, total, fraction: total === 0 ? 0 : complete / total };
}

export function computeOverallProgress(
  rooms: Room[],
  checked: CheckedItems,
): AggregateProgress {
  let complete = 0;
  let total = 0;
  for (const room of rooms) {
    const p = computeRoomProgress(room, checked);
    complete += p.complete;
    total += p.total;
  }
  return { complete, total, fraction: total === 0 ? 0 : complete / total };
}
