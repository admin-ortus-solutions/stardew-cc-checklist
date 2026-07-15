"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowser } from "./supabaseBrowser";
import { BOARD_ID, applyRemoteChange, type BoardState, type CheckRow } from "./board";

/**
 * Generic subscription to the shared `checks` board keyed by raw slot ids.
 * Used by feature panels (e.g. recipes) that store simple made/not-made ticks
 * under a namespaced slot id, alongside the Community Center in the same table.
 */
export function useChecks(channelName: string) {
  const [attribution, setAttribution] = useState<BoardState>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sb = getSupabaseBrowser();
    let active = true;

    (async () => {
      const { data } = await sb.from("checks").select("*").eq("board_id", BOARD_ID);
      if (!active) return;
      const initial: BoardState = {};
      for (const r of (data ?? []) as CheckRow[]) {
        initial[r.slot_id] = { checkedBy: r.checked_by, checkedAt: r.checked_at };
      }
      setAttribution(initial);
      setReady(true);
    })();

    const channel = sb
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "checks", filter: `board_id=eq.${BOARD_ID}` },
        (payload) => {
          const change =
            payload.eventType === "DELETE"
              ? { eventType: "DELETE" as const, old: payload.old as CheckRow }
              : { eventType: payload.eventType, new: payload.new as CheckRow };
          setAttribution((prev) => applyRemoteChange(prev, change));
        },
      )
      .subscribe();

    return () => {
      active = false;
      sb.removeChannel(channel);
    };
  }, [channelName]);

  const toggle = useCallback(
    async (slotId: string, name: string) => {
      const currentlyChecked = Boolean(attribution[slotId]);

      setAttribution((prev) => {
        const next = { ...prev };
        if (currentlyChecked) delete next[slotId];
        else next[slotId] = { checkedBy: name, checkedAt: new Date().toISOString() };
        return next;
      });

      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slotId, checked: !currentlyChecked, checkedBy: name }),
      }).catch(() => null);

      if (!res || !res.ok) {
        setAttribution((prev) => {
          const next = { ...prev };
          if (currentlyChecked) next[slotId] = { checkedBy: name, checkedAt: "" };
          else delete next[slotId];
          return next;
        });
      }
    },
    [attribution],
  );

  return { attribution, toggle, ready };
}
