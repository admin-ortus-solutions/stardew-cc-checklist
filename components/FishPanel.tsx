"use client";

import { useMemo, useState } from "react";
import { useChecks } from "@/lib/useChecks";
import {
  emptyFishFilter,
  fishLocations,
  fishProgress,
  fishSlotId,
  isCatchableNow,
  matchesFish,
  type FishFilter,
} from "@/lib/fish";
import { SEASONS, type Fish, type Season } from "@/lib/schema";

const hideImg = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.style.display = "none";
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function FishPanel({ fish, name }: { fish: Fish[]; name: string }) {
  const { attribution, toggle, ready } = useChecks("checks-fish");
  const [filter, setFilter] = useState<FishFilter>(emptyFishFilter);
  const [catchNow, setCatchNow] = useState(false);
  const [curSeason, setCurSeason] = useState<Season>("spring");
  const [raining, setRaining] = useState(false);
  const [night, setNight] = useState(false);

  const interactive = ready && name.trim() !== "";
  const locations = useMemo(() => fishLocations(fish), [fish]);
  const progress = fishProgress(fish, attribution);

  const isCaught = (id: string) => Boolean(attribution[fishSlotId(id)]);
  const shown = fish.filter((f) => matchesFish(f, filter, isCaught(f.id)));

  return (
    <div>
      <p className="panel-note">
        Catch every fish for Master Angler. Flip on <strong>Catchable now</strong> and set the
        conditions to see what&apos;s biting today — everyone&apos;s catches sync live.
      </p>

      <div className="overall">
        <div className="progress progress--big">
          <div className="progress__meta">
            <span className="progress__label">Fish</span>
            <span className="progress__count">
              {progress.caught}/{progress.total} caught · {Math.round(progress.fraction * 100)}%
            </span>
          </div>
          <div className="progress__track">
            <div className="progress__fill" style={{ width: `${Math.round(progress.fraction * 100)}%` }} />
          </div>
        </div>
      </div>

      <div className="controls">
        <input
          className="control control--search"
          type="search"
          placeholder="Search fish…"
          value={filter.search}
          onChange={(e) => setFilter({ ...filter, search: e.target.value })}
        />
        <select
          className="control"
          value={filter.season ?? ""}
          onChange={(e) => setFilter({ ...filter, season: (e.target.value || null) as Season | null })}
        >
          <option value="">All seasons</option>
          {SEASONS.map((s) => (
            <option key={s} value={s}>
              {cap(s)}
            </option>
          ))}
        </select>
        <select
          className="control"
          value={filter.location ?? ""}
          onChange={(e) => setFilter({ ...filter, location: e.target.value || null })}
        >
          <option value="">All locations</option>
          {locations.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <label className="control control--check">
          <input
            type="checkbox"
            checked={filter.hideCaught}
            onChange={(e) => setFilter({ ...filter, hideCaught: e.target.checked })}
          />
          Hide caught
        </label>
        <label className="control control--check">
          <input type="checkbox" checked={catchNow} onChange={(e) => setCatchNow(e.target.checked)} />
          Catchable now
        </label>
        {catchNow && (
          <>
            <select
              className="control"
              value={curSeason}
              onChange={(e) => setCurSeason(e.target.value as Season)}
            >
              {SEASONS.map((s) => (
                <option key={s} value={s}>
                  {cap(s)}
                </option>
              ))}
            </select>
            <label className="control control--check">
              <input type="checkbox" checked={raining} onChange={(e) => setRaining(e.target.checked)} />
              Raining
            </label>
            <label className="control control--check">
              <input type="checkbox" checked={night} onChange={(e) => setNight(e.target.checked)} />
              Night
            </label>
          </>
        )}
      </div>

      <ul className="recipes">
        {shown.map((f) => {
          const slot = fishSlotId(f.id);
          const caught = Boolean(attribution[slot]);
          const by = caught ? attribution[slot]?.checkedBy : "";
          const catchable = catchNow && isCatchableNow(f, curSeason, raining, night);
          const dimmed = catchNow && !catchable;
          return (
            <li
              key={f.id}
              className={`recipe${caught ? " recipe--made" : ""}${
                catchable ? " recipe--available" : ""
              }${dimmed ? " recipe--dimmed" : ""}`}
            >
              <input
                type="checkbox"
                className="recipe__check"
                id={slot}
                checked={caught}
                disabled={!interactive}
                onChange={() => toggle(slot, name)}
              />
              <img
                className="recipe__sprite"
                src={f.sprite}
                alt=""
                width={32}
                height={32}
                onError={hideImg}
              />
              <div className="recipe__body">
                <label className="recipe__name" htmlFor={slot}>
                  {f.name}
                </label>
                <span className="recipe__secondary" title={f.howToCatch}>
                  {f.locations.join(", ")}
                </span>
              </div>
              <span className="recipe__learn" title={f.howToCatch}>
                {f.seasons.length === 4 ? "All year" : f.seasons.map(cap).join(", ")}
              </span>
              {caught && by && <span className="recipe__by">{by}</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
