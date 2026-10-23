"use client";

import { useState, useRef } from "react";
import { matchBadge } from "@/lib/pace";

const SURFACE_ICON = { trail: "🌲", road: "🏙️", track: "🏟️" };
const SURFACE_GRADIENT = {
  trail: "linear-gradient(160deg, #2C5B3E, #4C8A5C)",
  road: "linear-gradient(160deg, #263447, #4A6FA5)",
  track: "linear-gradient(160deg, #4A2E22, #C2463A)",
};
const BADGE_STYLES = {
  great: "bg-accent/15 text-accent border border-accent/30",
  fast: "bg-accent-warm/15 text-accent-warm border border-accent-warm/30",
  easy: "bg-accent-blue/15 text-accent-blue border border-accent-blue/30",
};

const SWIPE_THRESHOLD = 90;
const EXIT_MS = 250;

function initials(name) {
  return (name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// One run at a time: swipe right (or tap the heart) to join, left (or the X)
// to skip. `runs` is the full, already-filtered list; the deck hides runs the
// person has skipped, joined, or is hosting. `onJoin(run)` resolves to true
// when the join worked, so a failed/blocked join snaps the card back.
export default function SwipeDeck({ runs, paceRange, userId, onJoin, onShowList }) {
  const [skipped, setSkipped] = useState(() => new Set());
  const [dragX, setDragX] = useState(0);
  const [exiting, setExiting] = useState(null); // 'left' | 'right' | null
  const drag = useRef({ active: false, startX: 0, id: null });

  const pool = runs.filter(
    (r) => !skipped.has(r.id) && !r.isJoinedByMe && !(userId && r.hostId === userId)
  );
  const visible = pool.slice(0, 3);
  const front = visible[0];

  function resetCard() {
    setDragX(0);
    setExiting(null);
  }

  async function commit(direction) {
    if (!front || exiting) return;
    const run = front;
    setExiting(direction);
    await new Promise((r) => setTimeout(r, EXIT_MS));
    if (direction === "left") {
      setSkipped((prev) => new Set(prev).add(run.id));
      resetCard();
      return;
    }
    const joined = await onJoin(run);
    // If joined, the run drops out of the deck by itself. If not (signed out,
    // full, error), the card comes back.
    resetCard();
    return joined;
  }

  function onPointerDown(e) {
    if (exiting) return;
    drag.current = { active: true, startX: e.clientX, id: e.pointerId };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  }
  function onPointerMove(e) {
    if (!drag.current.active) return;
    setDragX(e.clientX - drag.current.startX);
  }
  function onPointerUp() {
    if (!drag.current.active) return;
    drag.current.active = false;
    if (dragX > SWIPE_THRESHOLD) commit("right");
    else if (dragX < -SWIPE_THRESHOLD) commit("left");
    else setDragX(0);
  }

  const frontStyle = (() => {
    if (exiting === "right")
      return { transform: "translateX(560px) rotate(24deg)", opacity: 0, transition: `transform ${EXIT_MS}ms ease, opacity ${EXIT_MS}ms ease` };
    if (exiting === "left")
      return { transform: "translateX(-560px) rotate(-24deg)", opacity: 0, transition: `transform ${EXIT_MS}ms ease, opacity ${EXIT_MS}ms ease` };
    return {
      transform: `translateX(${dragX}px) rotate(${dragX / 18}deg)`,
      transition: dragX === 0 ? "transform .2s ease" : "none",
    };
  })();

  if (visible.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center border border-dashed border-line rounded-[18px] p-8 text-muted h-[460px]">
        <div className="font-display text-text text-[17px] mb-1">You&apos;re caught up</div>
        <div className="text-[13px] mb-5">
          {runs.length === 0
            ? "No runs match these filters right now."
            : "You've been through every run. See the full list, or bring back the ones you skipped."}
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={onShowList}
            className="bg-accent text-bg font-display font-bold text-[13.5px] rounded-xl py-2.5 px-5"
          >
            See list
          </button>
          {skipped.size > 0 && (
            <button
              onClick={() => setSkipped(new Set())}
              className="bg-bg-elevated border border-line text-text font-display font-semibold text-[13.5px] rounded-xl py-2.5 px-5"
            >
              Show skipped
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="relative h-[470px]">
        {visible
          .map((run, i) => {
            // visible[0] is the card on top; later ones sit behind it.
            const depth = i;
            const isFront = depth === 0;
            const baseStyle = isFront
              ? frontStyle
              : { transform: `translateY(${depth * 10}px) scale(${1 - depth * 0.035})` };
            return (
              <DeckCard
                key={run.id}
                run={run}
                paceRange={paceRange}
                dimmed={depth > 1}
                style={{ ...baseStyle, zIndex: 10 - depth }}
                handlers={
                  isFront
                    ? {
                        onPointerDown,
                        onPointerMove,
                        onPointerUp,
                        onPointerCancel: onPointerUp,
                      }
                    : {}
                }
                interactive={isFront}
              />
            );
          })
          .reverse()}
      </div>

      <div className="flex items-center justify-center gap-5 mt-4">
        <button
          onClick={() => commit("left")}
          aria-label="Skip this run"
          className="w-14 h-14 rounded-full border border-line bg-bg-elevated flex items-center justify-center text-[22px] text-accent-warm"
        >
          &#10005;
        </button>
        <button
          onClick={() => commit("right")}
          aria-label="Join this run"
          className="w-[68px] h-[68px] rounded-full border border-line bg-bg-elevated flex items-center justify-center text-[26px] text-accent"
        >
          &#9825;
        </button>
      </div>
      <div className="text-center text-[11.5px] text-muted mt-3">
        {pool.length} left to decide
      </div>
    </div>
  );
}

function DeckCard({ run, paceRange, style, handlers, dimmed, interactive }) {
  const badge = matchBadge(run.paceMinSec, paceRange);
  const avatars = run.joinedInitials.slice(0, 3);
  const extra = run.joinedCount > 3 ? run.joinedCount - 3 : 0;

  return (
    <div
      className="absolute inset-0 rounded-[18px] border border-line bg-bg-elevated overflow-hidden select-none"
      style={{
        ...style,
        opacity: dimmed ? 0.4 : style.opacity ?? 1,
        // Lets the page still scroll up/down with a finger while horizontal
        // drags are handled here. Without this phones cancel the swipe.
        touchAction: interactive ? "pan-y" : "auto",
        cursor: interactive ? "grab" : "default",
      }}
      {...handlers}
    >
      <div
        className="relative h-[132px] w-full flex items-center justify-center"
        style={{ background: SURFACE_GRADIENT[run.surface] }}
      >
        <div className="text-[46px] opacity-45">{SURFACE_ICON[run.surface]}</div>

        <div
          className={`absolute top-3 left-3.5 text-[10px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm ${BADGE_STYLES[badge.cls]}`}
        >
          {badge.text}
        </div>

        {!run.hostId && (
          <div className="absolute top-3 right-3.5 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-black/40 text-[#D8DCE1] border border-white/20">
            Example run
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,14,17,0.95)] via-[rgba(10,14,17,0.35)] to-transparent flex flex-col justify-end p-4">
          <div className="font-display font-bold text-[19px] text-white leading-tight">
            {run.location}
          </div>
          <div className="flex items-center justify-between gap-2 text-[12.5px] text-[#D8DCE1] mt-0.5">
            <span>{run.when}</span>
            {run.weather?.icon && (
              <span className="flex items-center gap-1">
                <span>{run.weather.icon}</span>
                {run.weather.temp}&deg;C
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-1.5 text-[11.5px] text-muted mb-3.5">
          <span className="w-1 h-1 rounded-full bg-accent inline-block" />
          Public meeting point, start/finish alert always sent
        </div>

        <div className="flex gap-2.5 mb-3.5">
          <div className="flex-1 bg-black/20 border border-line rounded-lg px-2.5 py-1.5">
            <div className="text-[10px] text-muted">distance</div>
            <div className="font-mono text-[15px] font-semibold">{run.distance}</div>
          </div>
          <div className="flex-1 bg-black/20 border border-line rounded-lg px-2.5 py-1.5">
            <div className="text-[10px] text-muted">pace</div>
            <div className="font-mono text-[15px] font-semibold">{run.pace}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3.5">
          <div className="flex -space-x-1.5">
            {avatars.map((n, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full bg-accent border-2 border-bg-elevated flex items-center justify-center text-[10px] font-bold text-bg"
              >
                {n}
              </div>
            ))}
          </div>
          <div className="text-[11.5px] text-muted">
            {run.joinedCount}/{run.capacity} runners going
            {extra > 0 ? ` , +${extra} more` : ""}
          </div>
        </div>

        {run.note && <div className="text-[13px] text-[#C7CCD3] leading-snug mb-3.5">{run.note}</div>}

        <div className="flex items-center gap-2.5 border-t border-line pt-3">
          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-[13px] font-bold text-bg flex-shrink-0">
            {initials(run.host)}
          </div>
          <div>
            <div className="text-[13px] font-semibold flex items-center gap-1">
              {run.host}
              {run.hostVerified && <span className="text-accent text-[12px]">&#10003;</span>}
            </div>
            {run.hostMeta && <div className="text-[11px] text-muted">{run.hostMeta}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
