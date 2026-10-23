"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import RunCard from "./RunCard";
import { matchBadge } from "@/lib/pace";
import { fetchRuns, joinRun, fetchMyProfile, JOIN_RESULT } from "@/lib/runs";
import { defaultPaceRange } from "@/lib/mockData";
import { useAuth } from "@/lib/AuthProvider";

export default function DiscoverDeck() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [allRuns, setAllRuns] = useState([]);
  const [paceRange, setPaceRange] = useState(defaultPaceRange);
  const [status, setStatus] = useState("loading"); // 'loading' | 'ready' | 'error'
  const [deckIndex, setDeckIndex] = useState(0);
  const [paceFilterOn, setPaceFilterOn] = useState(true);
  const [dragX, setDragX] = useState(0);
  const [exiting, setExiting] = useState(null); // 'left' | 'right' | null
  const [toast, setToast] = useState("");
  const dragState = useRef({ dragging: false, startX: 0 });

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    async function load() {
      try {
        const runs = await fetchRuns(user?.id);
        if (cancelled) return;
        setAllRuns(runs);

        if (user) {
          const profile = await fetchMyProfile(user.id);
          if (!cancelled && profile?.pace_min_sec && profile?.pace_max_sec) {
            setPaceRange({ min: profile.pace_min_sec, max: profile.pace_max_sec });
          }
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

  const pool = paceFilterOn
    ? allRuns.filter((r) => matchBadge(r.paceMinSec, paceRange).cls === "great")
    : allRuns;

  const visible = pool.slice(deckIndex, deckIndex + 3);

  function advance() {
    setDeckIndex((i) => i + 1);
    setDragX(0);
    setExiting(null);
  }

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(""), 2600);
  }

  async function handleJoin(run) {
    if (!user) {
      router.push("/sign-in");
      return;
    }
    try {
      const result = await joinRun(run, user.id);
      if (result === JOIN_RESULT.FULL) {
        showToast("This run is full.");
        return;
      }
      // JOINED or ALREADY_JOINED both mean the user is in, update optimistically.
      setAllRuns((prev) =>
        prev.map((r) =>
          r.id === run.id
            ? { ...r, isJoinedByMe: true, joinedCount: result === JOIN_RESULT.JOINED ? r.joinedCount + 1 : r.joinedCount }
            : r
        )
      );
    } catch (err) {
      console.error("Failed to join run:", err);
      showToast("Couldn't join this run, try again.");
    }
  }

  function swipe(direction, run) {
    if (direction === "right") handleJoin(run);
    setExiting(direction);
    setTimeout(advance, 250);
  }

  function onPointerDown(e) {
    dragState.current = { dragging: true, startX: e.clientX };
  }
  function onPointerMove(e) {
    if (!dragState.current.dragging) return;
    setDragX(e.clientX - dragState.current.startX);
  }
  function onPointerUp(frontRun) {
    if (!dragState.current.dragging) return;
    dragState.current.dragging = false;
    if (dragX > 90) swipe("right", frontRun);
    else if (dragX < -90) swipe("left", frontRun);
    else setDragX(0);
  }

  const frontStyle = (() => {
    if (exiting === "right") return { transform: "translateX(560px) rotate(24deg)", opacity: 0, transition: "transform .25s ease, opacity .25s ease" };
    if (exiting === "left") return { transform: "translateX(-560px) rotate(-24deg)", opacity: 0, transition: "transform .25s ease, opacity .25s ease" };
    return {
      transform: `translateX(${dragX}px) rotate(${dragX / 18}deg)`,
      transition: dragX === 0 ? "transform .2s ease" : "none",
    };
  })();

  return (
    <div className="px-5">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-bg-elevated border border-line text-text text-[12.5px] px-4 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {status === "loading" && (
        <div className="h-[500px] flex items-center justify-center text-muted text-[13px]">
          Loading runs...
        </div>
      )}

      {status === "error" && (
        <div className="h-[500px] flex flex-col items-center justify-center text-center border border-dashed border-line rounded-[18px] p-8 text-muted">
          <div className="font-display text-text text-[17px] mb-1">Couldn&apos;t load runs</div>
          <div className="text-[13px]">
            Check that .env.local has your Supabase URL and key, and that the runs table exists.
          </div>
        </div>
      )}

      {status === "ready" && (
        <>
      {/* Filters row */}
      <div className="flex items-center gap-2 mb-3.5">
        <div className="flex-1 flex items-center justify-between bg-bg-elevated border border-line rounded-2xl px-3.5 py-2.5">
          <div className="text-[11.5px] leading-tight">
            <div>Pace-matched only</div>
            <div className="text-muted text-[10px]">Only show great pace matches</div>
          </div>
          <button
            onClick={() => setPaceFilterOn((v) => !v)}
            className={`w-9 h-5 rounded-full relative transition-colors ${paceFilterOn ? "bg-accent/20 border border-accent" : "bg-black/20 border border-line"}`}
          >
            <span
              className={`absolute top-0.5 w-3.5 h-3.5 rounded-full transition-transform ${paceFilterOn ? "translate-x-[18px] bg-accent" : "translate-x-0.5 bg-muted"}`}
            />
          </button>
        </div>
      </div>

      {/* Deck */}
      <div className="relative h-[500px]">
        {visible.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center border border-dashed border-line rounded-[18px] p-8 text-muted">
            <div className="font-display text-text text-[17px] mb-1">You&apos;re caught up</div>
            <div className="text-[13px]">
              {paceFilterOn
                ? "No more pace-matched runs right now. Try turning the filter off, or post your own."
                : "No more runs nearby right now."}
            </div>
          </div>
        ) : (
          visible
            .map((run, i) => {
              const depth = visible.length - 1 - i;
              const isFront = depth === 0;
              const baseStyle = isFront
                ? frontStyle
                : {
                    transform: `translateY(${depth * 10}px) scale(${1 - depth * 0.035})`,
                  };
              return (
                <RunCard
                  key={run.id}
                  run={run}
                  paceRange={paceRange}
                  style={{ ...baseStyle, zIndex: 10 - depth }}
                  dimmed={depth > 1}
                  dragHandlers={
                    isFront
                      ? {
                          onPointerDown,
                          onPointerMove,
                          onPointerUp: () => onPointerUp(run),
                          onPointerLeave: () => onPointerUp(run),
                          style: { ...baseStyle, zIndex: 10 - depth, cursor: "grab" },
                        }
                      : {}
                  }
                />
              );
            })
            .reverse()
        )}
      </div>

      {/* Swipe actions */}
      {visible.length > 0 && (
        <div className="flex justify-center gap-5 mt-4">
          <button
            onClick={() => swipe("left", visible[visible.length - 1])}
            className="w-14 h-14 rounded-full border border-line bg-bg-elevated flex items-center justify-center text-[22px] text-accent-warm"
          >
            &#10005;
          </button>
          <button
            onClick={() => swipe("right", visible[visible.length - 1])}
            className="w-[68px] h-[68px] rounded-full border border-line bg-bg-elevated flex items-center justify-center text-[26px] text-accent"
          >
            &#9825;
          </button>
        </div>
      )}
        </>
      )}
    </div>
  );
}
