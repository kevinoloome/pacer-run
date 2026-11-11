"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { fetchMyProfile, updateMyProfile } from "@/lib/runs";
import {
  NUDGE_EVENT,
  isEngaged,
  bannerHidden,
  hideBanner,
  nameAskedRecently,
  markNameAsked,
  isDefaultName,
} from "@/lib/nudge";

// After a guest has joined or posted a run, ask for their name (once a day at most)
// and then gently offer to save their account. Never blocks anything.
export default function AccountNudge() {
  const { user, isGuest } = useAuth();
  const pathname = usePathname();
  const [name, setName] = useState(null); // current profile name
  const [engaged, setEngaged] = useState(false);
  const [askName, setAskName] = useState(false);
  const [bannerOff, setBannerOff] = useState(true);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!user || !isGuest) return;
    const eng = isEngaged();
    setEngaged(eng);
    setBannerOff(bannerHidden());
    try {
      const p = await fetchMyProfile(user.id);
      const current = p?.display_name || "";
      setName(current);
      if (eng && isDefaultName(current) && !nameAskedRecently()) setAskName(true);
    } catch {
      // Not critical: skip the prompts if the profile can't be read.
    }
  }, [user, isGuest]);

  useEffect(() => {
    refresh();
    window.addEventListener(NUDGE_EVENT, refresh);
    return () => window.removeEventListener(NUDGE_EVENT, refresh);
  }, [refresh]);

  if (!user || !isGuest) return null;
  if (/^\/(sign-in|sign-up|profile|feedback)/.test(pathname)) return null;

  async function saveName(e) {
    e.preventDefault();
    const clean = input.trim();
    if (clean.length < 2) {
      setError("Please enter your name.");
      return;
    }
    setSaving(true);
    try {
      await updateMyProfile(user.id, { display_name: clean });
      setName(clean);
      setAskName(false);
    } catch {
      setError("Couldn't save, try again.");
    } finally {
      setSaving(false);
    }
  }

  function skipName() {
    markNameAsked();
    setAskName(false);
  }

  if (askName) {
    return (
      <div className="fixed inset-0 z-[60] bg-black/60 flex items-end justify-center">
        <form
          onSubmit={saveName}
          className="w-full max-w-[430px] bg-bg-elevated border-t border-line rounded-t-3xl px-5 pt-6 pb-8"
        >
          <h2 className="font-display font-bold text-[19px] mb-1">What should runners call you?</h2>
          <p className="text-muted text-[13px] mb-4">
            Your name shows on runs you join, so people know who to look for at the meeting place.
          </p>
          <input
            autoFocus
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError("");
            }}
            placeholder="Your first name"
            maxLength={40}
            className="w-full bg-bg border border-line rounded-xl px-3.5 py-3 text-[14px] text-text placeholder:text-muted focus:outline-none focus:border-accent"
          />
          {error && <p className="text-accent-warm text-[12.5px] mt-2">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-accent text-bg font-display font-bold text-[15px] rounded-2xl py-3.5 mt-4 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save my name"}
          </button>
          <button
            type="button"
            onClick={skipName}
            className="w-full text-muted text-[13px] mt-3 py-1"
          >
            Not now
          </button>
        </form>
      </div>
    );
  }

  if (engaged && !isDefaultName(name) && !bannerOff) {
    return (
      <div className="fixed left-0 right-0 bottom-[76px] z-40 px-4">
        <div className="mx-auto max-w-[430px] bg-bg-elevated border border-accent/40 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg">
          <div className="flex-1 text-[12.5px] leading-snug">
            <div className="font-semibold text-text">Save your runs</div>
            <div className="text-muted">Add an email and password so you don&apos;t lose them.</div>
          </div>
          <Link
            href="/profile"
            className="bg-accent text-bg font-display font-bold text-[12.5px] rounded-xl px-3.5 py-2"
          >
            Save
          </Link>
          <button
            aria-label="Dismiss"
            onClick={() => {
              hideBanner();
              setBannerOff(true);
            }}
            className="text-muted text-[18px] leading-none px-1"
          >
            ×
          </button>
        </div>
      </div>
    );
  }
  return null;
}
