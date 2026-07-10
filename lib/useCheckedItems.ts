"use client";

import { useCallback, useEffect, useState } from "react";
import { fullContribution, type CheckedItems } from "./progress";
import type { BundleItem } from "./schema";

const STORAGE_KEY = "stardew-cc:checked";

export function useCheckedItems() {
  const [checked, setChecked] = useState<CheckedItems>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setChecked(JSON.parse(stored));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
  }, [checked, hydrated]);

  const toggle = useCallback((slot: BundleItem) => {
    setChecked((prev) => {
      const next = { ...prev };
      if (next[slot.id]) delete next[slot.id];
      else next[slot.id] = fullContribution(slot);
      return next;
    });
  }, []);

  return { checked, toggle, hydrated };
}
