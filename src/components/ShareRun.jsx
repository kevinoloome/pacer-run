"use client";

import { useState } from "react";

// Share buttons for a run. On phones the "Share" button opens the native share
// sheet (WhatsApp, Instagram, SMS...). Elsewhere it falls back to WhatsApp, and
// "Copy link" always works.
export function runLink(runId) {
  return `${window.location.origin}/runs/${runId}`;
}

export function runShareText(run) {
  const bits = [run.when, run.distance ? `${run.distance} km` : null, run.city].filter(Boolean);
  return `Join me for a run at ${run.location} (${bits.join(", ")}) on TwendeRun:`;
}

export default function ShareRun({ run, compact = false }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const link = runLink(run.id);
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      window.prompt("Copy this link:", link);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function share() {
    const url = runLink(run.id);
    const text = runShareText(run);
    if (navigator.share) {
      try {
        await navigator.share({ title: "TwendeRun", text, url });
      } catch {
        // They closed the share sheet. Nothing to do.
      }
      return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, "_blank", "noopener");
  }

  const pad = compact ? "py-2.5 text-[13.5px] rounded-xl" : "py-3 text-[14px] rounded-2xl";
  return (
    <div className="flex gap-2.5">
      <button
        onClick={share}
        className={`flex-1 bg-accent text-bg font-display font-bold ${pad}`}
      >
        Share this run
      </button>
      <button
        onClick={copy}
        className={`flex-1 bg-bg-elevated border border-line text-text font-display font-semibold ${pad}`}
      >
        {copied ? "Link copied" : "Copy link"}
      </button>
    </div>
  );
}
