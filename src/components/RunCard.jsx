"use client";

import { matchBadge } from "@/lib/pace";

const SURFACE_ICON = { trail: "🌲", road: "🏙️", track: "🏟️" };
const SURFACE_GRADIENT = {
  trail: "linear-gradient(160deg, #2C5B3E, #4C8A5C)",
  road: "linear-gradient(160deg, #263447, #4A6FA5)",
  track: "linear-gradient(160deg, #4A2E22, #C2463A)",
};

function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const BADGE_STYLES = {
  great: "bg-accent/15 text-accent border border-accent/30",
  fast: "bg-accent-warm/15 text-accent-warm border border-accent-warm/30",
  easy: "bg-accent-blue/15 text-accent-blue border border-accent-blue/30",
};

export default function RunCard({ run, paceRange, style, dragHandlers, dimmed }) {
  const badge = matchBadge(run.paceMinSec, paceRange);
  const avatars = run.joinedInitials.slice(0, 3);
  const extra = run.joinedCount > 3 ? run.joinedCount - 3 : 0;

  return (
    <div
      className="absolute inset-0 rounded-[18px] border border-line bg-bg-elevated overflow-hidden select-none"
      style={{ ...style, opacity: dimmed ? 0.4 : 1 }}
      {...dragHandlers}
    >
      {/* Photo hero */}
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

        <div className="absolute top-3 right-3.5 flex flex-col items-end gap-1">
          {run.isJoinedByMe && (
            <div className="text-[10px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm bg-accent text-bg">
              You&apos;re in
            </div>
          )}
          {/* Seed/demo runs have no real host account behind them. */}
          {!run.hostId && (
            <div className="text-[10px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm bg-black/40 text-[#D8DCE1] border border-white/20">
              Example run
            </div>
          )}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,14,17,0.95)] via-[rgba(10,14,17,0.35)] to-transparent flex flex-col justify-end p-4">
          <div className="font-display font-bold text-[19px] text-white leading-tight">
            {run.location}
          </div>
          <div className="flex items-center justify-between gap-2 text-[12.5px] text-[#D8DCE1] mt-0.5">
            <span>{run.when}</span>
            <span className="flex items-center gap-1">
              <span>{run.weather.icon}</span>
              {run.weather.temp}&deg;C
              {run.weather.rain >= 30 ? ` , ${run.weather.rain}% rain` : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 pt-4">
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

        <div className="text-[13px] text-[#C7CCD3] leading-snug mb-3.5">{run.note}</div>

        <div className="flex items-center gap-2.5 border-t border-line pt-3">
          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-[13px] font-bold text-bg flex-shrink-0">
            {initials(run.host)}
          </div>
          <div>
            <div className="text-[13px] font-semibold flex items-center gap-1">
              {run.host}
              {run.hostVerified && <span className="text-accent text-[12px]">&#10003;</span>}
            </div>
            <div className="text-[11px] text-muted">{run.hostMeta}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
