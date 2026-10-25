"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RequireAuth from "@/components/RequireAuth";
import { useAuth } from "@/lib/AuthProvider";
import { fetchMyRuns } from "@/lib/runs";

function MyRuns() {
  const { user } = useAuth();
  const [runs, setRuns] = useState([]);
  const [status, setStatus] = useState("loading"); // 'loading' | 'ready' | 'error'

  useEffect(() => {
    let cancelled = false;
    fetchMyRuns(user.id)
      .then((list) => {
        if (cancelled) return;
        setRuns(list);
        setStatus("ready");
      })
      .catch((err) => {
        console.error("Failed to load my runs:", err);
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  const hosting = runs.filter((r) => r.hostId === user.id);
  const going = runs.filter((r) => r.hostId !== user.id);

  return (
    <div className="px-5 py-6 max-w-[430px] mx-auto pb-28">
      <h1 className="font-display font-bold text-2xl mb-1.5">My runs</h1>
      <p className="text-muted text-[13.5px] mb-6">
        Runs you&apos;ve joined or are hosting. Open one for the meeting place and the chat.
      </p>

      {status === "loading" && (
        <div className="h-40 flex items-center justify-center text-muted text-[13px]">Loading...</div>
      )}

      {status === "error" && (
        <div className="border border-dashed border-line rounded-[18px] p-8 text-center text-muted text-[13px]">
          Couldn&apos;t load your runs. Check your connection and try again.
        </div>
      )}

      {status === "ready" && runs.length === 0 && (
        <div className="flex flex-col items-center text-center border border-dashed border-line rounded-[18px] p-8 text-muted">
          <div className="font-display text-text text-[17px] mb-1">No runs yet</div>
          <div className="text-[13px] mb-4">Join a run on Discover, or post your own.</div>
          <div className="flex gap-2.5">
            <Link
              href="/"
              className="bg-accent text-bg font-display font-bold text-[13.5px] rounded-xl py-2.5 px-5"
            >
              Find a run
            </Link>
            <Link
              href="/post"
              className="bg-bg-elevated border border-line text-text font-display font-semibold text-[13.5px] rounded-xl py-2.5 px-5"
            >
              Post a run
            </Link>
          </div>
        </div>
      )}

      {status === "ready" && going.length > 0 && <Section title="Going" runs={going} tag="Going" />}
      {status === "ready" && hosting.length > 0 && (
        <Section title="Hosting" runs={hosting} tag="Hosting" />
      )}
    </div>
  );
}

function Section({ title, runs, tag }) {
  return (
    <div className="mb-7">
      <div className="text-[12px] font-semibold text-muted uppercase tracking-wider mb-2.5">
        {title} ({runs.length})
      </div>
      <div className="flex flex-col gap-3">
        {runs.map((run) => (
          <Link
            key={run.id}
            href={`/runs/${run.id}`}
            className="block rounded-2xl border border-line bg-bg-elevated p-4 active:opacity-80"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-display font-bold text-[16px] leading-tight">{run.location}</div>
                <div className="text-[12.5px] text-muted mt-1">{run.when}</div>
              </div>
              <span className="shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-accent/15 text-accent border border-accent/30">
                {tag}
              </span>
            </div>
            <div className="flex items-center justify-between mt-3 text-[12px] text-muted">
              <span className="font-mono">
                {run.distance} &middot; {run.pace}
              </span>
              <span>
                {run.joinedCount}/{run.capacity} going &middot;{" "}
                <span className="text-accent font-semibold">Details &amp; chat &rsaquo;</span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function MyRunsPage() {
  return (
    <RequireAuth>
      <MyRuns />
    </RequireAuth>
  );
}
