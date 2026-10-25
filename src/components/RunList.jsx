"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { matchBadge } from "@/lib/pace";
import { fetchRuns, joinRun, leaveRun, fetchMyProfile, updateMyProfile, JOIN_RESULT } from "@/lib/runs";
import { defaultPaceRange } from "@/lib/mockData";
import SwipeDeck from "./SwipeDeck";
import { useAuth } from "@/lib/AuthProvider";
import { getLocalPace, PACE_CHANGED_EVENT } from "@/lib/localPace";

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
const DAY_FILTERS = [
  { value: "all", label: "All days" },
  { value: "weekday", label: "Weekdays" },
  { value: "weekend", label: "Weekends" },
];

function initials(name) {
  return (name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Everyone sees every posted run in one scrolling list and joins the ones
// they want. Pace-match is shown as a badge on each run, and can optionally
// be used as a filter.
export default function RunList() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [runs, setRuns] = useState([]);
  const [paceRange, setPaceRange] = useState(defaultPaceRange);
  const [status, setStatus] = useState("loading"); // 'loading' | 'ready' | 'error'
  const [paceOnly, setPaceOnly] = useState(false);
  const [dayFilter, setDayFilter] = useState("all");
  const [view, setView] = useState("swipe"); // 'swipe' | 'list'
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState("");
  const [authPrompt, setAuthPrompt] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    async function load() {
      try {
        const list = await fetchRuns(user?.id);
        if (cancelled) return;
        setRuns(list);

        // Pace priority: saved profile > pace picked in onboarding > default.
        const local = getLocalPace();
        if (user) {
          const profile = await fetchMyProfile(user.id);
          if (!cancelled && profile?.pace_min_sec && profile?.pace_max_sec) {
            setPaceRange({ min: profile.pace_min_sec, max: profile.pace_max_sec });
          } else if (!cancelled && local) {
            setPaceRange(local);
            updateMyProfile(user.id, {
              pace_min_sec: local.min,
              pace_max_sec: local.max,
            }).catch((err) => console.error("Couldn't save pace to profile:", err));
          }
        } else if (local) {
          setPaceRange(local);
        }
        if (!cancelled) setStatus("ready");
      } catch (err) {
        console.error("Failed to load runs:", err);
        if (!cancelled) setStatus("error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  // Onboarding finishes after this component has mounted: pick up its pace.
  useEffect(() => {
    function onPaceChanged() {
      if (user) return;
      const local = getLocalPace();
      if (local) setPaceRange(local);
    }
    window.addEventListener(PACE_CHANGED_EVENT, onPaceChanged);
    return () => window.removeEventListener(PACE_CHANGED_EVENT, onPaceChanged);
  }, [user]);

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(""), 2600);
  }

  // Resolves to true only when the person is now in the run.
  async function handleJoin(run) {
    if (!user) {
      setAuthPrompt(true);
      return false;
    }
    setBusyId(run.id);
    try {
      const result = await joinRun(run, user.id);
      if (result === JOIN_RESULT.FULL) {
        showToast("This run is full.");
        return false;
      }
      setRuns((prev) =>
        prev.map((r) =>
          r.id === run.id
            ? {
                ...r,
                isJoinedByMe: true,
                joinedCount: result === JOIN_RESULT.JOINED ? r.joinedCount + 1 : r.joinedCount,
              }
            : r
        )
      );
      showToast("You're in! Find it under My runs.");
      return true;
    } catch (err) {
      console.error("Failed to join run:", err);
      showToast("Couldn't join this run, try again.");
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function handleLeave(run) {
    if (!user) return;
    if (!window.confirm(`Leave the run at ${run.location}?`)) return;
    setBusyId(run.id);
    try {
      await leaveRun(run.id, user.id);
      setRuns((prev) =>
        prev.map((r) =>
          r.id === run.id
            ? { ...r, isJoinedByMe: false, joinedCount: Math.max(0, r.joinedCount - 1) }
            : r
        )
      );
    } catch (err) {
      console.error("Failed to leave run:", err);
      showToast("Couldn't leave this run, try again.");
    } finally {
      setBusyId(null);
    }
  }

  const visible = runs.filter((r) => {
    if (paceOnly && matchBadge(r.paceMinSec, paceRange).cls !== "great") return false;
    if (dayFilter !== "all" && r.dayCat !== dayFilter) return false;
    return true;
  });

  return (
    <div className="px-5">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-bg-elevated border border-line text-text text-[12.5px] px-4 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {authPrompt && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 flex items-end justify-center"
          onClick={() => setAuthPrompt(false)}
        >
          <div
            className="w-full max-w-[430px] bg-bg-elevated border-t border-line rounded-t-3xl px-6 pt-6 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display font-bold text-[19px] mb-1.5">Create a free account to join</h3>
            <p className="text-muted text-[13px] mb-5">
              It takes under a minute. You can keep browsing without one.
            </p>
            <button
              onClick={() => router.push("/sign-up")}
              className="w-full bg-accent text-bg font-display font-bold text-[15px] rounded-2xl py-3.5 mb-2.5"
            >
              Create account
            </button>
            <button
              onClick={() => router.push("/sign-in")}
              className="w-full bg-bg border border-line text-text font-display font-semibold text-[14px] rounded-2xl py-3 mb-2"
            >
              I already have an account
            </button>
            <button
              onClick={() => setAuthPrompt(false)}
              className="w-full text-center text-[12.5px] text-muted py-1"
            >
              Not now
            </button>
          </div>
        </div>
      )}

      {status === "loading" && (
        <div className="h-[400px] flex items-center justify-center text-muted text-[13px]">
          Loading runs...
        </div>
      )}

      {status === "error" && (
        <div className="h-[400px] flex flex-col items-center justify-center text-center border border-dashed border-line rounded-[18px] p-8 text-muted">
          <div className="font-display text-text text-[17px] mb-1">Couldn&apos;t load runs</div>
          <div className="text-[13px]">
            Check your connection and try again. If it keeps happening, the database may be paused.
          </div>
        </div>
      )}

      {status === "ready" && (
        <>
          <div className="flex items-center justify-between mb-3">
            <div className="flex rounded-full border border-line bg-bg-elevated p-0.5">
              {[
                { value: "swipe", label: "Swipe" },
                { value: "list", label: "List" },
              ].map((v) => (
                <button
                  key={v.value}
                  onClick={() => setView(v.value)}
                  className={`rounded-full px-4 py-1.5 text-[12.5px] font-semibold ${
                    view === v.value ? "bg-accent text-bg" : "text-muted"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
            <Link
              href="/post"
              className="text-[12.5px] font-semibold text-accent border border-accent/40 rounded-full px-3.5 py-1.5"
            >
              + Post a run
            </Link>
          </div>

          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
            <button
              onClick={() => setPaceOnly((v) => !v)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[12px] font-medium ${
                paceOnly
                  ? "bg-accent/15 border-accent text-accent"
                  : "bg-bg-elevated border-line text-muted"
              }`}
            >
              Matches my pace
            </button>
            {DAY_FILTERS.map((d) => (
              <button
                key={d.value}
                onClick={() => setDayFilter(d.value)}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[12px] font-medium ${
                  dayFilter === d.value
                    ? "bg-accent/15 border-accent text-accent"
                    : "bg-bg-elevated border-line text-muted"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {view === "swipe" && runs.length > 0 ? (
            <SwipeDeck
              runs={visible}
              paceRange={paceRange}
              userId={user?.id}
              onJoin={handleJoin}
              onShowList={() => setView("list")}
            />
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center border border-dashed border-line rounded-[18px] p-8 text-muted">
              <div className="font-display text-text text-[17px] mb-1">
                {runs.length === 0 ? "No runs yet" : "No runs match these filters"}
              </div>
              <div className="text-[13px] mb-4">
                {runs.length === 0
                  ? "Be the first to post one for your running family."
                  : "Try clearing a filter, or post your own run."}
              </div>
              <Link
                href="/post"
                className="bg-accent text-bg font-display font-bold text-[14px] rounded-2xl py-2.5 px-5"
              >
                Post a run
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {visible.map((run) => (
                <RunItem
                  key={run.id}
                  run={run}
                  paceRange={paceRange}
                  isMine={!!user && run.hostId === user.id}
                  busy={busyId === run.id}
                  onJoin={() => handleJoin(run)}
                  onLeave={() => handleLeave(run)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RunItem({ run, paceRange, isMine, busy, onJoin, onLeave }) {
  const badge = matchBadge(run.paceMinSec, paceRange);
  const avatars = run.joinedInitials.slice(0, 3);
  const full = run.joinedCount >= run.capacity;

  return (
    <div className="rounded-[18px] border border-line bg-bg-elevated overflow-hidden">
      <div
        className="relative h-[120px] w-full flex items-center justify-center"
        style={{ background: SURFACE_GRADIENT[run.surface] }}
      >
        <div className="text-[42px] opacity-45">{SURFACE_ICON[run.surface]}</div>

        <div
          className={`absolute top-3 left-3.5 text-[10px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm ${BADGE_STYLES[badge.cls]}`}
        >
          {badge.text}
        </div>

        <div className="absolute top-3 right-3.5 flex flex-col items-end gap-1">
          {isMine && (
            <div className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-accent text-bg">
              Your run
            </div>
          )}
          {run.isJoinedByMe && (
            <div className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-accent text-bg">
              You&apos;re in
            </div>
          )}
          {!run.hostId && (
            <div className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-black/40 text-[#D8DCE1] border border-white/20">
              Example run
            </div>
          )}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,14,17,0.95)] via-[rgba(10,14,17,0.3)] to-transparent flex flex-col justify-end p-4">
          <div className="font-display font-bold text-[18px] text-white leading-tight">
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

        {run.note && <div className="text-[13px] text-[#C7CCD3] leading-snug mb-3.5">{run.note}</div>}

        <div className="flex items-center gap-2.5 mb-3.5">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-[12px] font-bold text-bg flex-shrink-0">
            {initials(run.host)}
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold flex items-center gap-1">
              <span className="truncate">{run.host}</span>
              {run.hostVerified && <span className="text-accent text-[12px]">&#10003;</span>}
            </div>
            {run.hostMeta && <div className="text-[11px] text-muted truncate">{run.hostMeta}</div>}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
          <div className="flex items-center gap-2">
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
              {run.joinedCount}/{run.capacity} going
            </div>
          </div>

          {isMine ? (
            <Link href={`/runs/${run.id}`} className="text-[12.5px] font-semibold text-accent">
              Details &amp; chat &rsaquo;
            </Link>
          ) : run.isJoinedByMe ? (
            <div className="flex items-center gap-3">
              <Link href={`/runs/${run.id}`} className="text-[12.5px] font-semibold text-accent">
                Details &amp; chat &rsaquo;
              </Link>
              <button
                onClick={onLeave}
                disabled={busy}
                className="text-[12px] text-muted underline disabled:opacity-50"
              >
                Leave
              </button>
            </div>
          ) : (
            <button
              onClick={onJoin}
              disabled={busy || full}
              className="bg-accent text-bg font-display font-bold text-[13.5px] rounded-xl py-2 px-5 disabled:opacity-50"
            >
              {full ? "Run full" : busy ? "Joining..." : "Join"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
