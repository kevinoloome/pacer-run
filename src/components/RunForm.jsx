"use client";

import { useState } from "react";
import AuthInput from "@/components/AuthInput";
import { parsePace } from "@/lib/pace";
import { dayCatOf, fromInputValue, toInputValue } from "@/lib/when";

const SURFACES = [
  { value: "trail", label: "Trail" },
  { value: "road", label: "Road" },
  { value: "track", label: "Track" },
];

// Shared by "Post a run" and "Edit run". `initial` pre-fills the fields when
// editing; `minCapacity` stops a host lowering the capacity below the number
// of runners already in. `onSubmit(input)` should throw on failure.
export default function RunForm({ initial = {}, minCapacity = 1, submitLabel, busyLabel, onSubmit }) {
  const [location, setLocation] = useState(initial.location ?? "");
  const [startsAt, setStartsAt] = useState(initial.startsAt ?? "");
  const [distanceKm, setDistanceKm] = useState(initial.distanceKm ?? "");
  const [pace, setPace] = useState(initial.pace ?? "");
  const [surface, setSurface] = useState(initial.surface ?? "trail");
  const [capacity, setCapacity] = useState(initial.capacity ?? "6");
  const [note, setNote] = useState(initial.note ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const nowValue = toInputValue(new Date().toISOString());

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!location.trim()) {
      setError("Enter where the run starts.");
      return;
    }
    const startsAtIso = fromInputValue(startsAt);
    if (!startsAtIso) {
      setError("Pick the date and time the run starts.");
      return;
    }
    if (new Date(startsAtIso).getTime() < Date.now() - 60 * 1000) {
      setError("That time has already passed. Pick a future date and time.");
      return;
    }
    const distance = parseFloat(distanceKm);
    if (!distance || distance <= 0) {
      setError("Enter a valid distance in km.");
      return;
    }
    const paceSec = parsePace(pace);
    if (!paceSec) {
      setError("Enter pace as m:ss, e.g. 5:30.");
      return;
    }
    const cap = parseInt(capacity, 10);
    if (!cap || cap <= 0) {
      setError("Enter a valid capacity.");
      return;
    }
    if (cap < minCapacity) {
      setError(`${minCapacity} runners have already joined, so capacity can't be lower than that.`);
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        location: location.trim(),
        startsAt: startsAtIso,
        distanceKm: distance,
        surface,
        dayCat: dayCatOf(startsAtIso),
        paceSec,
        capacity: cap,
        note: note.trim(),
      });
    } catch (err) {
      setError(err?.message || "Couldn't save this run, try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      <AuthInput
        label="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Karura Forest, Limuru Rd gate"
      />

      <label className="block mb-3.5">
        <div className="text-[12px] font-medium text-muted mb-1.5">Date and time (Nairobi time)</div>
        <input
          type="datetime-local"
          value={startsAt}
          min={nowValue}
          onChange={(e) => setStartsAt(e.target.value)}
          className="w-full bg-bg-elevated border border-line rounded-xl px-3.5 py-3 text-[14px] text-text focus:outline-none focus:border-accent [color-scheme:dark]"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <AuthInput
          label="Distance (km)"
          inputMode="decimal"
          value={distanceKm}
          onChange={(e) => setDistanceKm(e.target.value)}
          placeholder="8"
        />
        <AuthInput
          label="Pace (m:ss / km)"
          value={pace}
          onChange={(e) => setPace(e.target.value)}
          placeholder="5:30"
        />
      </div>

      <div className="mb-3.5">
        <div className="text-[12px] font-medium text-muted mb-1.5">Surface</div>
        <div className="flex gap-2">
          {SURFACES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSurface(s.value)}
              className={`flex-1 rounded-xl py-2.5 text-[13px] font-medium border ${
                surface === s.value
                  ? "bg-accent/15 border-accent text-accent"
                  : "bg-bg-elevated border-line text-muted"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <AuthInput
        label="Capacity (max runners)"
        inputMode="numeric"
        value={capacity}
        onChange={(e) => setCapacity(e.target.value)}
        placeholder="6"
      />

      <label className="block mb-3.5">
        <div className="text-[12px] font-medium text-muted mb-1.5">Note (optional)</div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Easy conversational pace, one water stop..."
          rows={3}
          className="w-full bg-bg-elevated border border-line rounded-xl px-3.5 py-3 text-[14px] text-text placeholder:text-muted focus:outline-none focus:border-accent resize-none"
        />
      </label>

      {error && <p className="text-accent-warm text-[12.5px] mb-3">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-accent text-bg font-display font-bold text-[15px] rounded-2xl py-3.5 mt-1.5 disabled:opacity-60"
      >
        {loading ? busyLabel : submitLabel}
      </button>
    </form>
  );
}
